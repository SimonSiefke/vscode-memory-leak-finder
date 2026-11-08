import { execFile } from 'node:child_process'
import { readFile, readlink } from 'node:fs/promises'
import { get, type IncomingMessage } from 'node:http'
import WebSocket from 'ws'
import { basename } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { promisify } from 'node:util'
import { findChildProcess } from '../FindChildProcess/FindChildProcess.ts'

const execFileAsync = promisify(execFile)

const getInspectorUrl = async (port: number): Promise<string | undefined> => {
  try {
    const response = await new Promise<IncomingMessage>((resolve, reject) => {
      get(`http://127.0.0.1:${port}/json/list`, { agent: false, signal: AbortSignal.timeout(500) }, resolve).once('error', reject)
    })
    response.setEncoding('utf8')
    let body = ''
    for await (const chunk of response) body += chunk
    const targets = JSON.parse(body) as { webSocketDebuggerUrl?: string }[]
    return targets[0]?.webSocketDebuggerUrl
  } catch {
    return undefined
  }
}

const getInspectorPid = async (url: string): Promise<number> => {
  const socket = new WebSocket(url)
  try {
    return await new Promise<number>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out verifying Node inspector PID')), 5000)
      const fail = (error: Error) => {
        clearTimeout(timeout)
        reject(error)
      }
      socket.addEventListener('error', () => fail(new Error('Failed to connect to Node inspector')))
      socket.addEventListener('close', () => fail(new Error('Node inspector closed before PID verification')))
      socket.addEventListener('open', () =>
        socket.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: 'process.pid', returnByValue: true } })),
      )
      socket.addEventListener('message', (event) => {
        const message = JSON.parse(String(event.data))
        if (message.id === 1) {
          clearTimeout(timeout)
          if (!Number.isInteger(message.result?.result?.value)) {
            reject(new Error('Node inspector did not return a PID'))
          } else {
            resolve(message.result.result.value)
          }
        }
      })
    })
  } finally {
    socket.close()
  }
}

// Only inspect a descendant of this test's Electron process. An editor in another
// session may run the same language server and must never receive our signal.
export const inspectChildProcess = async (rootPid: number, name: string) => {
  if (process.platform !== 'linux') {
    return undefined
  }
  const { stdout } = await execFileAsync('ps', ['-eo', 'pid=,ppid=,args='])
  const processes = stdout.split('\n').flatMap((line) => {
    const match = /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(line)
    return match ? [{ pid: Number(match[1]), ppid: Number(match[2]), command: match[3] }] : []
  })
  const child = findChildProcess(processes, rootPid, name)
  if (!child) {
    return undefined
  }
  const argv = (await readFile(`/proc/${child.pid}/cmdline`, 'utf8')).split('\0').filter(Boolean)
  const executable = basename(await readlink(`/proc/${child.pid}/exe`))
  if (executable !== 'node' && executable !== 'nodejs') {
    const environment = await readFile(`/proc/${child.pid}/environ`, 'utf8')
    if (!environment.split('\0').includes('ELECTRON_RUN_AS_NODE=1')) {
      throw new Error(`PID ${child.pid} is not a Node process`)
    }
  }
  const inspectArg = argv.find((arg) => /^--inspect(?:-port|-brk)?=/.test(arg))
  const port = inspectArg ? Number(inspectArg.split(/[=:]/).at(-1)) : 9229
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Cannot determine inspector port for PID ${child.pid}`)
  }
  let url = await getInspectorUrl(port)
  if (!url) {
    process.kill(child.pid, 'SIGUSR1')
    for (let attempt = 0; attempt < 50 && !url; attempt++) {
      await delay(100)
      url = await getInspectorUrl(port)
    }
  }
  if (!url) {
    throw new Error(`Node inspector for PID ${child.pid} did not start on port ${port}`)
  }
  const actualPid = await getInspectorPid(url)
  if (actualPid !== child.pid) {
    throw new Error(`Inspector port ${port} belongs to PID ${actualPid}, expected ${child.pid}`)
  }
  console.log(`Verified inspected child process: ${JSON.stringify({ rootPid, pid: child.pid, port, command: child.command })}`)
  return { args: argv.slice(1), command: argv[0], inspectPort: port, pid: child.pid, runtimeName: 'node' }
}

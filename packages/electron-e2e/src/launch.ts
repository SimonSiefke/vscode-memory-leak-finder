import { spawn, type ChildProcess } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { verifyMainProcess, type MainProcessIdentity } from './identity.ts'
import { getElectronBinary } from './prepare.ts'
import { createConnection } from '../../memory-leak-finder/src/parts/DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'

export const stopChild = async (child: ChildProcess): Promise<void> => {
  const kill = (signal: NodeJS.Signals) => {
    try {
      if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, signal)
      else child.kill(signal)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error
    }
  }
  if (child.exitCode === null && child.signalCode === null) {
    const exited = new Promise<void>((resolve) => child.once('exit', () => resolve()))
    kill('SIGTERM')
    const controller = new AbortController()
    try {
      await Promise.race([exited, delay(3000, undefined, { signal: controller.signal })])
    } finally {
      controller.abort()
    }
  }
  // Also reap descendants if the main process crashed first.
  kill('SIGKILL')
}

export const launch = async (workspace: string, userDataPath: string, noSandbox: boolean) => {
  const env: NodeJS.ProcessEnv = { ...process.env, ELECTRON_E2E_USER_DATA: userDataPath, ELECTRON_E2E_NODE_PATH: process.execPath }
  delete env.ELECTRON_RUN_AS_NODE
  delete env.NODE_OPTIONS
  const child = spawn(getElectronBinary(workspace), ['--inspect=127.0.0.1:0', ...(noSandbox ? ['--no-sandbox'] : []), workspace], {
    detached: process.platform !== 'win32',
    env,
    stdio: ['ignore', 'ignore', 'pipe'],
  })
  let logs = ''
  try {
    const endpoint = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => finish(new Error(`Timed out waiting for Electron inspector.\n${logs}`)), 30_000)
      const finish = (error?: Error, url?: string) => {
        clearTimeout(timer)
        child.off('error', onError)
        child.off('exit', onExit)
        child.stderr.off('data', onData)
        if (error) reject(error)
        else resolve(url!)
      }
      const onError = (error: Error) => finish(error)
      const onExit = () => finish(new Error(`Electron exited before inspector was ready.\n${logs}`))
      const onData = (chunk: Buffer) => {
        logs = (logs + chunk.toString()).slice(-8000)
        const match = /Debugger listening on (ws:\/\/127\.0\.0\.1:\d+\/[^\s]+)/.exec(logs)
        if (match) finish(undefined, match[1])
      }
      child.once('error', onError)
      child.once('exit', onExit)
      child.stderr.on('data', onData)
    })
    child.stderr.on('data', (chunk: Buffer) => {
      logs = (logs + chunk.toString()).slice(-8000)
    })
    const rpc = await createConnection(endpoint, { connectionTimeoutMs: 10_000, requestTimeoutMs: 120_000 })
    try {
      const evaluate = async (expression: string): Promise<unknown> => {
        const response = await rpc.invoke('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
        if (response.error || response.result?.exceptionDetails) {
          throw new Error(`Electron evaluation failed: ${JSON.stringify(response)}`)
        }
        return response.result.result.value
      }
      const deadline = Date.now() + 30_000
      while (!(await evaluate('Boolean(globalThis.electronE2E)'))) {
        if (Date.now() > deadline) throw new Error(`Electron fixture did not initialize.\n${logs}`)
        await delay(50)
      }
      await evaluate('globalThis.electronE2E.ready')
      const identity = (await evaluate(
        '({ pid: process.pid, type: process.type, electron: process.versions.electron })',
      )) as MainProcessIdentity
      verifyMainProcess(identity, child.pid)
      return { child, rpc, evaluate, identity }
    } catch (error) {
      rpc.dispose()
      throw error
    }
  } catch (error) {
    await stopChild(child)
    throw error
  }
}

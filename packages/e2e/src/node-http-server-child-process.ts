import assert from 'node:assert'
import type { TestContext } from '../types.js'

interface DataResponse {
  readonly childExited: boolean
  readonly message: string
  readonly ok: boolean
}

export const skip = false

const createServerSource = () => {
  return `import { fork } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import http from 'node:http'
import { fileURLToPath } from 'node:url'

const host = '127.0.0.1'
const port = Number(process.env.MEMORY_LEAK_FINDER_SERVER_PORT)

const listen = (server, port) => {
  const { promise, reject, resolve } = Promise.withResolvers()
  const handleError = (error) => {
    server.off('error', handleError)
    reject(error)
  }
  server.once('error', handleError)
  server.listen(port, host, () => {
    server.off('error', handleError)
    resolve()
  })
  return promise
}

const childProcessFileUrl = new URL('./child-process-fixture.cjs', import.meta.url)
await writeFile(
  childProcessFileUrl,
  \`process.on('message', (message) => {
  if (message === 'ping' && process.send) {
    process.send('pong')
  }
})
\`,
)

const waitForChildMessage = (childProcess) => {
  const { promise, reject, resolve } = Promise.withResolvers()
  const handleMessage = (message) => {
    cleanup()
    resolve(message)
  }
  const handleError = (error) => {
    cleanup()
    reject(error)
  }
  const handleExit = (code, signal) => {
    cleanup()
    reject(new Error('Child process exited before responding: code=' + code + ' signal=' + signal))
  }
  const cleanup = () => {
    childProcess.off('message', handleMessage)
    childProcess.off('error', handleError)
    childProcess.off('exit', handleExit)
  }
  childProcess.once('message', handleMessage)
  childProcess.once('error', handleError)
  childProcess.once('exit', handleExit)
  return promise
}

const waitForChildExit = (childProcess) => {
  if (childProcess.exitCode !== null || childProcess.signalCode !== null) {
    return Promise.resolve()
  }
  const { promise, reject, resolve } = Promise.withResolvers()
  const handleExit = () => {
    cleanup()
    resolve()
  }
  const handleError = (error) => {
    cleanup()
    reject(error)
  }
  const cleanup = () => {
    childProcess.off('exit', handleExit)
    childProcess.off('error', handleError)
  }
  childProcess.once('exit', handleExit)
  childProcess.once('error', handleError)
  return promise
}

const runChildProcessRoundTrip = async () => {
  const childProcess = fork(fileURLToPath(childProcessFileUrl), {
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
  })
  childProcess.send('ping')
  const message = await waitForChildMessage(childProcess)
  childProcess.kill()
  await waitForChildExit(childProcess)
  return {
    childExited: true,
    message,
    ok: true,
  }
}

const handleRequest = async (request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ ok: true }))
    return
  }

  if (request.url === '/data') {
    const result = await runChildProcessRoundTrip()
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify(result))
    return
  }

  response.writeHead(404, { 'content-type': 'application/json' })
  response.end(JSON.stringify({ ok: false }))
}

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    response.writeHead(500, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ ok: false, message: error instanceof Error ? error.message : String(error) }))
  })
})

await listen(server, port)
`
}

export const setup = async ({ Editor, Explorer, ExternalRuntime, Terminal, Workspace }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Explorer.focus()

  const { inspectPort, serverPort } = await ExternalRuntime.createPorts()
  await ExternalRuntime.startExternalRuntime({
    entryFile: 'server.js',
    entrySource: createServerSource(),
    inspectPort,
    serverPort,
  })
}

export const run = async ({ ExternalRuntime }: TestContext): Promise<void> => {
  const body = await ExternalRuntime.getJson<DataResponse>('/data')
  assert.deepStrictEqual(body, {
    childExited: true,
    message: 'pong',
    ok: true,
  })
}

export const teardown = async ({ Editor, ExternalRuntime, Terminal, Workspace }: TestContext): Promise<void> => {
  await ExternalRuntime.dispose()
  await Terminal.killAll()
  await Editor.closeAll()
  await Workspace.setFiles([])
}

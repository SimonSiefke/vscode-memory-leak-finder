import assert from 'node:assert'
import type { TestContext } from '../types.ts'

interface DataResponse {
  readonly contextCreated: boolean
  readonly message: string
  readonly ok: boolean
}

export const skip = false

const createServerSource = () => {
  return `import http from 'node:http'
import * as vm from 'node:vm'

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

const runVmRoundTrip = () => {
  const sandbox = {
    ok: false,
    message: '',
  }
  const context = vm.createContext(sandbox)
  const script = new vm.Script(\`ok = true
message = 'pong'\`)
  script.runInContext(context)
  return {
    contextCreated: true,
    message: sandbox.message,
    ok: sandbox.ok,
  }
}

const handleRequest = async (request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ ok: true }))
    return
  }

  if (request.url === '/data') {
    const result = runVmRoundTrip()
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
    contextCreated: true,
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

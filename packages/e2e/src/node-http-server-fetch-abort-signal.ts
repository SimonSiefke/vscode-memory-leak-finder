import assert from 'node:assert'
import type { TestContext } from '../types.js'

interface DataResponse {
  readonly aliveSignalCount: number
  readonly iterations: number
  readonly ok: boolean
}

export const skip = false

const iterations = 200
const maxAliveSignalCount = 5

const createServerSource = () => {
  return `import http from 'node:http'
import { setTimeout as delay } from 'node:timers/promises'

const host = '127.0.0.1'
const port = Number(process.env.MEMORY_LEAK_FINDER_SERVER_PORT)
const iterations = ${iterations}

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

const forceGc = async () => {
  if (typeof globalThis.gc !== 'function') {
    throw new Error('Expected gc to be exposed')
  }
  for (let i = 0; i < 8; i++) {
    globalThis.gc()
    await delay(0)
  }
}

const helloWorldServer = http.createServer((request, response) => {
  if (request.url === '/hello') {
    response.writeHead(200, { 'content-type': 'text/plain' })
    response.end('hello world')
    return
  }

  response.writeHead(404, { 'content-type': 'application/json' })
  response.end(JSON.stringify({ ok: false }))
})

await listen(helloWorldServer, 0)

const address = helloWorldServer.address()

if (!address || typeof address === 'string') {
  throw new Error('Failed to determine hello world server port')
}

const helloWorldUrl = new URL('/hello', 'http://' + host + ':' + address.port)

const runLeakCheck = async () => {
  const signalRefs = []
  for (let i = 0; i < iterations; i++) {
    const controller = new AbortController()
    signalRefs.push(new WeakRef(controller.signal))
    const upstreamResponse = await fetch(helloWorldUrl, { signal: controller.signal })
    const text = await upstreamResponse.text()
    if (text !== 'hello world') {
      throw new Error('Expected upstream to respond with hello world but received ' + text)
    }
  }
  await forceGc()
  const aliveSignalCount = signalRefs.filter((signalRef) => signalRef.deref()).length
  return {
    aliveSignalCount,
    iterations,
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
    const result = await runLeakCheck()
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
  assert.strictEqual(body.ok, true)
  assert.strictEqual(body.iterations, iterations)
  assert.ok(
    body.aliveSignalCount <= maxAliveSignalCount,
    `Expected at most ${maxAliveSignalCount} AbortSignal instances to remain alive after GC but found ${body.aliveSignalCount}`,
  )
}

export const teardown = async ({ Editor, ExternalRuntime, Terminal, Workspace }: TestContext): Promise<void> => {
  await ExternalRuntime.dispose()
  await Terminal.killAll()
  await Editor.closeAll()
  await Workspace.setFiles([])
}
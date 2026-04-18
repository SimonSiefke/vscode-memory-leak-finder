import assert from 'node:assert'
import type { TestContext } from '../types.ts'

interface DataResponse {
  readonly iterations: number
  readonly ok: boolean
  readonly shadowRealmAvailable: boolean
}

export const skip = false

const iterations = 100

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

const runAndBreathe = async (fn, repeat, waitTime = 20) => {
  for (let i = 0; i < repeat; i++) {
    await fn()
    await delay(waitTime)
  }
}

const runShadowRealmRegressionCheck = async () => {
  if (typeof ShadowRealm !== 'function') {
    throw new Error('Expected ShadowRealm to be available')
  }
  await runAndBreathe(() => {
    const realm = new ShadowRealm()
    realm.evaluate('new TextEncoder(); 1;')
  }, iterations)
  return {
    iterations,
    ok: true,
    shadowRealmAvailable: true,
  }
}

const handleRequest = async (request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ ok: true }))
    return
  }

  if (request.url === '/data') {
    const result = await runShadowRealmRegressionCheck()
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
    args: [
      `--inspect=127.0.0.1:${inspectPort}`,
      '--expose-gc',
      '--experimental-shadow-realm',
      '--max-old-space-size=20',
      'server.js',
    ],
    command: 'node',
    entryFile: 'server.js',
    entrySource: createServerSource(),
    inspectPort,
    runtimeName: 'node',
    serverPort,
  })
}

export const run = async ({ ExternalRuntime }: TestContext): Promise<void> => {
  const body = await ExternalRuntime.getJson<DataResponse>('/data')
  assert.deepStrictEqual(body, {
    iterations,
    ok: true,
    shadowRealmAvailable: true,
  })
}

export const teardown = async ({ Editor, ExternalRuntime, Terminal, Workspace }: TestContext): Promise<void> => {
  await ExternalRuntime.dispose()
  await Terminal.killAll()
  await Editor.closeAll()
  await Workspace.setFiles([])
}
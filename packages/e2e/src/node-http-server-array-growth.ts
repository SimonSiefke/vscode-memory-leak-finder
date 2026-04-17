import { readFile } from 'node:fs/promises'
import type { TestContext } from '../types.ts'
import { createPorts, startExternalRuntime, type ExternalRuntimeHandle } from './parts/ExternalRuntime/ExternalRuntime.ts'

export const skip = false

let runtime: ExternalRuntimeHandle | undefined

const createLeakingServerSource = () => {
  return `import http from 'node:http'

const port = Number(process.env.MEMORY_LEAK_FINDER_SERVER_PORT)
const leakedRequests = []
globalThis.__memoryLeakFinderLeakedRequests = leakedRequests

const server = http.createServer(async (request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ ok: true }))
    return
  }

  if (request.url === '/leak' && request.method === 'POST') {
    let body = ''
    for await (const chunk of request) {
      body += chunk
    }
    leakedRequests.push({
      copy: body.repeat(4),
      index: leakedRequests.length,
      original: body,
    })
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ leaked: leakedRequests.length }))
    return
  }

  response.writeHead(404, { 'content-type': 'application/json' })
  response.end(JSON.stringify({ ok: false }))
})

server.listen(port, '127.0.0.1')
`
}

export const setup = async ({ Editor, Explorer, Terminal, Workspace }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Explorer.focus()

  const { inspectPort, serverPort } = await createPorts()
  runtime = await startExternalRuntime({
    Workspace,
    entryFile: 'server.mjs',
    entrySource: createLeakingServerSource(),
    inspectPort,
    runtimeName: 'node',
    serverPort,
  })
}

export const run = async (): Promise<void> => {
  if (!runtime) {
    throw new Error('Expected Node runtime to be started in setup')
  }

  const requestCount = 12
  const payload = 'memory-leak-finder-request-'.repeat(256)

  for (let index = 0; index < requestCount; index++) {
    const response = await runtime.request('/leak', {
      body: `${payload}${index}`,
      headers: {
        'content-type': 'text/plain',
      },
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error(`Expected /leak to respond with 200 but received ${response.status}`)
    }
  }

  const leakedRequestLength = await runtime.evaluate('globalThis.__memoryLeakFinderLeakedRequests.length')
  if (leakedRequestLength !== requestCount) {
    throw new Error(`Expected leaked request count to be ${requestCount} but received ${String(leakedRequestLength)}`)
  }

  await runtime.evaluate('globalThis.gc?.() ?? null')
  const snapshotPath = await runtime.takeSnapshot('node-http-server-array-growth')
  const snapshotText = await readFile(snapshotPath, 'utf8')
  if (!snapshotText.includes('__memoryLeakFinderLeakedRequests')) {
    throw new Error('Expected heap snapshot to contain the named leaked request array')
  }
}

export const teardown = async ({ Editor, Terminal, Workspace }: TestContext): Promise<void> => {
  if (runtime) {
    await runtime.dispose()
    runtime = undefined
  }
  await Terminal.killAll()
  await Editor.closeAll()
  await Workspace.setFiles([])
}

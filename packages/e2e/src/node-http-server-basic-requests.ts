import type { TestContext } from '../types.ts'

interface DataResponse {
  readonly ok: boolean
  readonly runtime: string
}

export const skip = false

const createServerSource = () => {
  return `import http from 'node:http'

const port = Number(process.env.MEMORY_LEAK_FINDER_SERVER_PORT)
const runtime = typeof Bun !== 'undefined' ? 'bun' : 'node'

const server = http.createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ ok: true }))
    return
  }

  if (request.url === '/data') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ ok: true, runtime }))
    return
  }

  response.writeHead(404, { 'content-type': 'application/json' })
  response.end(JSON.stringify({ ok: false }))
})

server.listen(port, '127.0.0.1')
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
  const response = await ExternalRuntime.request('/data')
  if (!response.ok) {
    throw new Error(`Expected /data to respond with 200 but received ${response.status}`)
  }
  const body = (await response.json()) as DataResponse
  const runtime = await ExternalRuntime.getRuntimeName()
  if (body.runtime !== runtime) {
    throw new Error(`Expected runtime response to be ${runtime} but received ${body.runtime}`)
  }
}

export const teardown = async ({ Editor, ExternalRuntime, Terminal, Workspace }: TestContext): Promise<void> => {
  await ExternalRuntime.dispose()
  await Terminal.killAll()
  await Editor.closeAll()
  await Workspace.setFiles([])
}

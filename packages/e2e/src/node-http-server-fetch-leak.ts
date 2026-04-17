import type { TestContext } from '../types.ts'

export const skip = false

const createServerSource = () => {
  return `import http from 'node:http'

const host = '127.0.0.1'
const port = Number(process.env.MEMORY_LEAK_FINDER_SERVER_PORT)

const listen = (server, port) => {
  return new Promise((resolve, reject) => {
    const handleError = (error) => {
      server.off('error', handleError)
      reject(error)
    }
    server.once('error', handleError)
    server.listen(port, host, () => {
      server.off('error', handleError)
      resolve()
    })
  })
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

const handleRequest = async (request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ ok: true }))
    return
  }

  if (request.url === '/data') {
    const upstreamResponse = await fetch(helloWorldUrl)
    const text = await upstreamResponse.text()
    response.writeHead(200, { 'content-type': 'text/plain' })
    response.end(text)
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
  for (let i = 0; i < 5; i++) {
    const response = await ExternalRuntime.request('/data')
    if (!response.ok) {
      throw new Error(`Expected /data to respond with 200 but received ${response.status}`)
    }
    const body = await response.text()
    if (body !== 'hello world') {
      throw new Error(`Expected /data to respond with hello world but received ${body}`)
    }
  }
}

export const teardown = async ({ Editor, ExternalRuntime, Terminal, Workspace }: TestContext): Promise<void> => {
  await ExternalRuntime.dispose()
  await Terminal.killAll()
  await Editor.closeAll()
  await Workspace.setFiles([])
}

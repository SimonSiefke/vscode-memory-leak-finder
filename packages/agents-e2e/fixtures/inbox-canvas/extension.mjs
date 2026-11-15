import { createServer } from 'node:http'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createCanvas, joinSession } from '@github/copilot-sdk/extension'

let session
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://127.0.0.1')
    if (request.method === 'POST' && url.pathname === '/open') {
      const events = await session.getEvents()
      if (!events.some((event) => event.type === 'user.message' && event.data.content === url.searchParams.get('prompt'))) {
        response.statusCode = 409
        response.end('This is a different fixture session')
        return
      }
      const result = await session.rpc.canvas.open({ canvasId: 'inbox-contract', instanceId: 'inbox-contract-instance' })
      response.setHeader('content-type', 'application/json')
      response.end(JSON.stringify(result))
      return
    }
    response.setHeader('content-type', 'text/html')
    response.end('<!doctype html><title>Inbox contract canvas</title><h1>Inbox contract canvas</h1>')
  } catch (error) {
    response.statusCode = 500
    response.end(String(error))
  }
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
try {
  session = await joinSession({
    canvases: [
      createCanvas({
        id: 'inbox-contract',
        displayName: 'Inbox contract canvas',
        description: 'Deterministic local subscription fixture.',
        open: () => ({ url: `http://127.0.0.1:${server.address().port}` }),
      }),
    ],
  })
  // Opening during join can precede the product's SDK listeners. The harness
  // explicitly opens only after the real chat response has completed.
  const ready = join(dirname(fileURLToPath(import.meta.url)), 'ready')
  await mkdir(ready, { recursive: true })
  await writeFile(join(ready, `${session.sessionId}.json`), JSON.stringify({ sessionId: session.sessionId, port: server.address().port }))
} catch (error) {
  server.closeAllConnections()
  server.close()
  throw error
}
process.once('SIGTERM', () => {
  server.closeAllConnections()
  server.close()
  process.exit(0)
})

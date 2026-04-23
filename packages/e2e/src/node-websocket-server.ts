import assert from 'node:assert'
import { setTimeout as delay } from 'node:timers/promises'
import type { TestContext } from '../types.js'

interface WebSocketInfoResponse {
  readonly ok: boolean
  readonly url: string
}

interface WebSocketResultResponse {
  readonly message: string
  readonly ok: boolean
}

export const skip = false

const createServerSource = () => {
  return `import crypto from 'node:crypto'
import http from 'node:http'

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

const createWebSocketAccept = (key) => {
  return crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')
}

const decodeFrame = (buffer) => {
  if (buffer.length < 2) {
    return undefined
  }

  const secondByte = buffer[1]
  const isMasked = (secondByte & 0x80) !== 0
  if (!isMasked) {
    throw new Error('Expected client websocket frames to be masked')
  }

  let offset = 2
  let payloadLength = secondByte & 0x7f

  if (payloadLength === 126) {
    if (buffer.length < offset + 2) {
      return undefined
    }
    payloadLength = buffer.readUInt16BE(offset)
    offset += 2
  } else if (payloadLength === 127) {
    throw new Error('Large websocket frames are not supported in this fixture')
  }

  if (buffer.length < offset + 4 + payloadLength) {
    return undefined
  }

  const opcode = buffer[0] & 0x0f
  const maskingKey = buffer.subarray(offset, offset + 4)
  offset += 4
  const payload = buffer.subarray(offset, offset + payloadLength)
  const unmaskedPayload = Buffer.allocUnsafe(payloadLength)

  for (let index = 0; index < payloadLength; index++) {
    unmaskedPayload[index] = payload[index] ^ maskingKey[index % 4]
  }

  return {
    bytesRead: offset + payloadLength,
    opcode,
    text: unmaskedPayload.toString('utf8'),
  }
}

const encodeTextFrame = (text) => {
  const payload = Buffer.from(text)
  if (payload.length > 125) {
    throw new Error('Large websocket frames are not supported in this fixture')
  }
  return Buffer.concat([Buffer.from([0x81, payload.length]), payload])
}

let result = ''

const webSocketServer = http.createServer((request, response) => {
  response.writeHead(426, { 'content-type': 'application/json' })
  response.end(JSON.stringify({ ok: false }))
})

webSocketServer.on('upgrade', (request, socket) => {
  const websocketKey = request.headers['sec-websocket-key']
  const upgradeHeader = request.headers.upgrade

  if (upgradeHeader !== 'websocket' || typeof websocketKey !== 'string') {
    socket.write('HTTP/1.1 400 Bad Request\\r\\n\\r\\n')
    socket.destroy()
    return
  }

  const acceptValue = createWebSocketAccept(websocketKey)
  socket.write(
    [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      'Sec-WebSocket-Accept: ' + acceptValue,
      '',
      '',
    ].join('\\r\\n'),
  )

  let pending = Buffer.alloc(0)

  socket.on('data', (chunk) => {
    pending = Buffer.concat([pending, chunk])

    while (pending.length > 0) {
      const frame = decodeFrame(pending)
      if (!frame) {
        return
      }
      pending = pending.subarray(frame.bytesRead)

      if (frame.opcode === 0x8) {
        socket.end()
        return
      }

      if (frame.opcode !== 0x1) {
        continue
      }

      if (frame.text === 'ping') {
        socket.write(encodeTextFrame('pong'))
        continue
      }

      if (frame.text === 'websocket test work') {
        result = frame.text
      }
    }
  })
})

await listen(webSocketServer, 0)

const webSocketAddress = webSocketServer.address()

if (!webSocketAddress || typeof webSocketAddress === 'string') {
  throw new Error('Failed to determine websocket server port')
}

const webSocketUrl = 'ws://' + host + ':' + webSocketAddress.port

const server = http.createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ ok: true }))
    return
  }

  if (request.url === '/websocket-info') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ ok: true, url: webSocketUrl }))
    return
  }

  if (request.url === '/result') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ ok: true, message: result }))
    return
  }

  response.writeHead(404, { 'content-type': 'application/json' })
  response.end(JSON.stringify({ ok: false }))
})

await listen(server, port)
`
}

const waitForWebSocketOpen = async (webSocket: WebSocket): Promise<void> => {
  if (webSocket.readyState === WebSocket.OPEN) {
    return
  }
  const { promise, reject, resolve } = Promise.withResolvers<void>()
  const handleOpen = () => {
    cleanup()
    resolve()
  }
  const handleError = (event: Event) => {
    cleanup()
    reject(new Error(`Failed to open websocket: ${event.type}`))
  }
  const cleanup = () => {
    webSocket.removeEventListener('open', handleOpen)
    webSocket.removeEventListener('error', handleError)
  }
  webSocket.addEventListener('open', handleOpen)
  webSocket.addEventListener('error', handleError)
  await promise
}

const getMessageText = async (data: unknown): Promise<string> => {
  if (typeof data === 'string') {
    return data
  }
  if (data instanceof Blob) {
    return await data.text()
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString('utf8')
  }
  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('utf8')
  }
  return String(data)
}

const waitForWebSocketMessage = async (webSocket: WebSocket): Promise<string> => {
  const { promise, reject, resolve } = Promise.withResolvers<string>()
  const handleMessage = async (event: MessageEvent) => {
    cleanup()
    try {
      resolve(await getMessageText(event.data))
    } catch (error) {
      reject(error)
    }
  }
  const handleError = (event: Event) => {
    cleanup()
    reject(new Error(`Websocket message failed: ${event.type}`))
  }
  const cleanup = () => {
    webSocket.removeEventListener('message', handleMessage)
    webSocket.removeEventListener('error', handleError)
  }
  webSocket.addEventListener('message', handleMessage)
  webSocket.addEventListener('error', handleError)
  return promise
}

const waitForResult = async (ExternalRuntime: TestContext['ExternalRuntime']): Promise<string> => {
  for (let attempt = 0; attempt < 40; attempt++) {
    const response = await ExternalRuntime.getJson<WebSocketResultResponse>('/result')
    if (response.message) {
      return response.message
    }
    await delay(50)
  }
  throw new Error('Timed out waiting for websocket result')
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
  const info = await ExternalRuntime.getJson<WebSocketInfoResponse>('/websocket-info')
  assert.strictEqual(info.ok, true)

  const webSocket = new WebSocket(info.url)
  await waitForWebSocketOpen(webSocket)
  webSocket.send('ping')

  const response = await waitForWebSocketMessage(webSocket)
  assert.strictEqual(response, 'pong')

  webSocket.send('websocket test work')
  webSocket.close()

  const result = await waitForResult(ExternalRuntime)
  assert.strictEqual(result, 'websocket test work')
}

export const teardown = async ({ Editor, ExternalRuntime, Terminal, Workspace }: TestContext): Promise<void> => {
  await ExternalRuntime.dispose()
  await Terminal.killAll()
  await Editor.closeAll()
  await Workspace.setFiles([])
}

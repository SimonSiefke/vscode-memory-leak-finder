import { afterEach, expect, test } from '@jest/globals'
import { createServer as createHttpServer, request as httpRequest } from 'node:http'
import { connect as netConnect, createServer as createTcpServer, type Server } from 'node:net'
import { connect as tlsConnect } from 'node:tls'
import * as HttpProxyServer from '../src/parts/HttpProxyServer/HttpProxyServer.ts'

const servers: Server[] = []

const listen = async (server: Server): Promise<number> => {
  servers.push(server)
  return new Promise((resolve, reject) => {
    const handleError = (error: Error): void => {
      reject(error)
    }
    server.once('error', handleError)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', handleError)
      const address = server.address()
      if (address && typeof address === 'object') {
        resolve(address.port)
        return
      }
      reject(new Error('Server did not listen on a TCP port'))
    })
  })
}

const closeServer = async (server: Server): Promise<void> => {
  if (!server.listening) {
    return
  }
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })
}

const requestThroughProxy = async (
  proxyPort: number,
  targetUrl: string,
): Promise<{
  body: string
  statusCode: number
}> => {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      {
        hostname: '127.0.0.1',
        method: 'GET',
        path: targetUrl,
        port: proxyPort,
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => {
          chunks.push(chunk)
        })
        res.on('end', () => {
          resolve({
            body: Buffer.concat(chunks).toString('utf8'),
            statusCode: res.statusCode || 0,
          })
        })
      },
    )
    req.on('error', reject)
    req.end()
  })
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map(closeServer))
})

test('createHttpProxyServer - useProxyMock blocks unmatched HTTP requests from reaching the network', async () => {
  let targetRequestCount = 0
  const targetServer = createHttpServer((_req, res) => {
    targetRequestCount++
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('live response')
  })
  const targetPort = await listen(targetServer)
  const proxyServer = await HttpProxyServer.createHttpProxyServer({ useProxyMock: true })

  try {
    const response = await requestThroughProxy(proxyServer.port, `http://127.0.0.1:${targetPort}/api/data`)

    expect(response.statusCode).toBe(502)
    expect(JSON.parse(response.body)).toEqual({
      error: 'Mock response not found',
      message: 'Proxy mock mode is enabled, but no mock response exists for this request. Refusing to forward request to the network.',
      target: `http://127.0.0.1:${targetPort}/api/data`,
    })
    expect(targetRequestCount).toBe(0)
  } finally {
    await proxyServer[Symbol.asyncDispose]()
  }
})

const requestThroughHttpsProxy = async (
  proxyPort: number,
  targetPort: number,
): Promise<{
  body: string
  statusCode: number
}> => {
  return new Promise((resolve, reject) => {
    let settled = false
    const fail = (error: Error): void => {
      if (!settled) {
        settled = true
        reject(error)
      }
    }
    const socket = netConnect({ host: '127.0.0.1', port: proxyPort }, () => {
      socket.write(`CONNECT localhost:${targetPort} HTTP/1.1\r\nHost: localhost:${targetPort}\r\n\r\n`)
    })
    socket.on('error', fail)

    let connectResponse = Buffer.alloc(0)
    const handleConnectData = (chunk: Buffer): void => {
      connectResponse = Buffer.concat([connectResponse, chunk])
      const headerEnd = connectResponse.indexOf('\r\n\r\n')
      if (headerEnd === -1) {
        return
      }
      socket.off('data', handleConnectData)
      const header = connectResponse.subarray(0, headerEnd).toString('utf8')
      if (!header.startsWith('HTTP/1.1 200')) {
        fail(new Error(`Unexpected CONNECT response: ${header}`))
        return
      }

      const tlsSocket = tlsConnect({ rejectUnauthorized: false, servername: 'localhost', socket }, () => {
        tlsSocket.write(`GET /api/data HTTP/1.1\r\nHost: 127.0.0.1:${targetPort}\r\nConnection: close\r\n\r\n`)
      })
      const responseChunks: Buffer[] = []
      const finishIfComplete = (): void => {
        const responseBuffer = Buffer.concat(responseChunks)
        const responseText = responseBuffer.toString('utf8')
        const responseHeaderEnd = responseText.indexOf('\r\n\r\n')
        if (responseHeaderEnd === -1) {
          return
        }
        const responseHeader = responseText.slice(0, responseHeaderEnd)
        const contentLengthMatch = /^content-length:\s*(\d+)$/im.exec(responseHeader)
        const contentLength = contentLengthMatch ? Number.parseInt(contentLengthMatch[1], 10) : 0
        const bodyStart = responseHeaderEnd + 4
        if (responseBuffer.length < bodyStart + contentLength) {
          return
        }
        const statusMatch = /^HTTP\/\d\.\d\s+(\d+)/.exec(responseHeader)
        if (!statusMatch) {
          fail(new Error(`Unexpected HTTPS response: ${responseHeader}`))
          return
        }
        if (!settled) {
          settled = true
          tlsSocket.end()
          resolve({
            body: responseBuffer.subarray(bodyStart, bodyStart + contentLength).toString('utf8'),
            statusCode: Number.parseInt(statusMatch[1], 10),
          })
        }
      }
      tlsSocket.on('data', (chunk: Buffer) => {
        responseChunks.push(chunk)
        finishIfComplete()
      })
      tlsSocket.on('error', fail)
    }
    socket.on('data', handleConnectData)
  })
}

test('createHttpProxyServer - useProxyMock blocks unmatched HTTPS requests from reaching the network', async () => {
  let targetConnectionCount = 0
  const targetServer = createTcpServer((socket) => {
    targetConnectionCount++
    socket.end()
  })
  const targetPort = await listen(targetServer)
  const proxyServer = await HttpProxyServer.createHttpProxyServer({ useProxyMock: true })

  try {
    const response = await requestThroughHttpsProxy(proxyServer.port, targetPort)

    expect(response.statusCode).toBe(502)
    expect(JSON.parse(response.body)).toEqual({
      error: 'Mock response not found',
      message: 'Proxy mock mode is enabled, but no mock response exists for this request. Refusing to forward request to the network.',
      target: 'https://localhost/api/data',
    })
    expect(targetConnectionCount).toBe(0)
  } finally {
    await proxyServer[Symbol.asyncDispose]()
  }
})

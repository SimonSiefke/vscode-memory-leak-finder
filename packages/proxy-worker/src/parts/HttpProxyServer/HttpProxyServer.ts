import { createServer, IncomingMessage, ServerResponse } from 'http'
import { createServer as createHttpsServer } from 'https'
import { URL } from 'url'
import * as GetCertificateForDomain from '../GetCertificateForDomain/GetCertificateForDomain.ts'
import * as GetMockResponse from '../GetMockResponse/GetMockResponse.ts'
import * as SaveRequest from '../SaveRequest/SaveRequest.ts'
import * as SavePostBody from '../SavePostBody/SavePostBody.ts'

interface HttpProxyServerOptions {
  port: number
  useProxyMock: boolean
}

interface HttpProxyServerInstance {
  port: number
  url: string
  dispose: () => Promise<void>
}

const collectRequestBody = async (req: IncomingMessage): Promise<Buffer> => {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

const handleHttpRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
  useProxyMock: boolean,
): Promise<void> => {
  try {
    const url = req.url || ''
    const method = req.method || 'GET'
    const fullUrl = url.startsWith('http') ? url : `http://${req.headers.host}${url}`

    // Check for mock response first if mocking is enabled
    if (useProxyMock) {
      const mockResponse = await GetMockResponse.getMockResponse(method, fullUrl)
      if (mockResponse) {
        GetMockResponse.sendMockResponse(res, mockResponse, req.httpVersion)
        return
      }
    }

    // Save POST body if applicable
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      const body = await collectRequestBody(req)
      const headers: Record<string, string> = {}
      for (const [key, value] of Object.entries(req.headers)) {
        if (value !== undefined) {
          headers[key] = Array.isArray(value) ? value.join(', ') : value
        }
      }
      await SavePostBody.savePostBody(method, fullUrl, headers, body)
    }

    // Forward the request
    const parsedUrl = new URL(fullUrl)
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: req.headers,
    }

    const protocol = parsedUrl.protocol === 'https:' ? await import('https') : await import('http')
    const proxyReq = protocol.request(options, async (proxyRes) => {
      const responseChunks: Buffer[] = []
      for await (const chunk of proxyRes) {
        responseChunks.push(chunk)
      }
      const responseData = Buffer.concat(responseChunks)

      // Save the request/response
      const responseHeaders: Record<string, string | string[]> = {}
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        if (value !== undefined) {
          responseHeaders[key] = value
        }
      }
      await SaveRequest.saveRequest(
        req,
        proxyRes.statusCode || 200,
        proxyRes.statusMessage,
        responseHeaders,
        responseData,
      )

      // Send response to client
      res.writeHead(proxyRes.statusCode || 200, proxyRes.statusMessage, proxyRes.headers)
      res.end(responseData)
    })

    proxyReq.on('error', (error) => {
      console.error(`[Proxy] Error forwarding request:`, error)
      res.writeHead(500)
      res.end('Proxy error')
    })

    // Forward request body if present
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      const body = await collectRequestBody(req)
      proxyReq.write(body)
    }

    proxyReq.end()
  } catch (error) {
    console.error(`[Proxy] Error handling HTTP request:`, error)
    res.writeHead(500)
    res.end('Proxy error')
  }
}

const handleConnect = async (
  req: IncomingMessage,
  socket: NodeJS.ReadableStream & NodeJS.WritableStream,
  head: Buffer,
  useProxyMock: boolean,
): Promise<void> => {
  try {
    const url = req.url || ''
    const [hostname, portStr] = url.split(':')
    const port = portStr ? parseInt(portStr, 10) : 443

    // Check for mock response first if mocking is enabled
    if (useProxyMock) {
      const mockResponse = await GetMockResponse.getMockResponse('GET', `https://${url}`)
      if (mockResponse) {
        socket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
        // For HTTPS, we'd need to handle TLS, but for mocking we can just close
        socket.end()
        return
      }
    }

    // Get certificate for this domain
    const certPair = await GetCertificateForDomain.getCertificateForDomain(hostname)

    // Create HTTPS server for MITM
    const httpsServer = createHttpsServer({
      key: certPair.key,
      cert: certPair.cert,
    })

    httpsServer.on('request', async (clientReq: IncomingMessage, clientRes: ServerResponse) => {
      const method = clientReq.method || 'GET'
      const fullUrl = `https://${hostname}${clientReq.url || ''}`

      // Check for mock response
      if (useProxyMock) {
        const mockResponse = await GetMockResponse.getMockResponse(method, fullUrl)
        if (mockResponse) {
          GetMockResponse.sendMockResponse(clientRes, mockResponse, clientReq.httpVersion)
          return
        }
      }

      // Save POST body if applicable
      if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        const body = await collectRequestBody(clientReq)
        const headers: Record<string, string> = {}
        for (const [key, value] of Object.entries(clientReq.headers)) {
          if (value !== undefined) {
            headers[key] = Array.isArray(value) ? value.join(', ') : value
          }
        }
        await SavePostBody.savePostBody(method, fullUrl, headers, body)
      }

      // Forward to actual server
      const options = {
        hostname: hostname,
        port: port,
        path: clientReq.url || '/',
        method: method,
        headers: clientReq.headers,
      }

      const https = await import('https')
      const proxyReq = https.request(options, async (proxyRes) => {
        const responseChunks: Buffer[] = []
        for await (const chunk of proxyRes) {
          responseChunks.push(chunk)
        }
        const responseData = Buffer.concat(responseChunks)

        // Save the request/response
        const responseHeaders: Record<string, string | string[]> = {}
        for (const [key, value] of Object.entries(proxyRes.headers)) {
          if (value !== undefined) {
            responseHeaders[key] = value
          }
        }
        await SaveRequest.saveRequest(
          clientReq,
          proxyRes.statusCode || 200,
          proxyRes.statusMessage,
          responseHeaders,
          responseData,
        )

        // Send response to client
        clientRes.writeHead(proxyRes.statusCode || 200, proxyRes.statusMessage, proxyRes.headers)
        clientRes.end(responseData)
      })

      proxyReq.on('error', (error) => {
        console.error(`[Proxy] Error forwarding HTTPS request:`, error)
        clientRes.writeHead(500)
        clientRes.end('Proxy error')
      })

      // Forward request body if present
      if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        const body = await collectRequestBody(clientReq)
        proxyReq.write(body)
      }

      proxyReq.end()
    })

    httpsServer.on('error', (error) => {
      console.error(`[Proxy] HTTPS server error:`, error)
      socket.end()
    })

    // Upgrade socket to HTTPS
    socket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
    httpsServer.emit('connection', socket)
  } catch (error) {
    console.error(`[Proxy] Error handling CONNECT:`, error)
    socket.end()
  }
}

export const createHttpProxyServer = async (
  options: HttpProxyServerOptions,
): Promise<HttpProxyServerInstance> => {
  const { port, useProxyMock } = options

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // Handle HTTP requests
    await handleHttpRequest(req, res, useProxyMock)
  })

  server.on('connect', async (req: IncomingMessage, socket: NodeJS.ReadableStream & NodeJS.WritableStream, head: Buffer) => {
    await handleConnect(req, socket, head, useProxyMock)
  })

  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      const address = server.address()
      const actualPort = typeof address === 'object' && address !== null ? address.port : port
      const url = `http://localhost:${actualPort}`

      resolve({
        port: actualPort,
        url,
        dispose: async () => {
          return new Promise<void>((resolveDispose) => {
            server.close(() => {
              resolveDispose()
            })
          })
        },
      })
    })

    server.on('error', (error) => {
      reject(error)
    })
  })
}


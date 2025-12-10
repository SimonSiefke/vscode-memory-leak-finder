import { createServer, IncomingMessage, ServerResponse } from 'http'
import { request as httpRequest } from 'http'
import { request as httpsRequest } from 'https'
import { createSecureContext } from 'tls'
import { createGunzip, createInflate, createBrotliDecompress } from 'zlib'
import { URL } from 'url'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import * as Root from '../Root/Root.ts'
import * as CertificateManager from '../CertificateManager/CertificateManager.ts'
import * as GetMockResponse from '../GetMockResponse/GetMockResponse.ts'
import * as SavePostBody from '../SavePostBody/SavePostBody.ts'
import * as SaveRequest from '../SaveRequest/SaveRequest.ts'

const REQUESTS_DIR = join(Root.root, '.vscode-requests')

const sanitizeFilename = (url: string): string => {
  return url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 200)
}

const decompressBody = async (body: Buffer, encoding: string | string[] | undefined): Promise<{ body: string; wasCompressed: boolean }> => {
  if (!encoding) {
    return { body: body.toString('utf8'), wasCompressed: false }
  }

  const encodingStr = Array.isArray(encoding) ? encoding[0] : encoding
  const normalizedEncoding = encodingStr.toLowerCase().trim()

  if (normalizedEncoding === 'gzip') {
    return new Promise((resolve, reject) => {
      const gunzip = createGunzip()
      const chunks: Buffer[] = []
      gunzip.on('data', (chunk: Buffer) => chunks.push(chunk))
      gunzip.on('end', () => {
        const decompressed = Buffer.concat(chunks).toString('utf8')
        resolve({ body: decompressed, wasCompressed: true })
      })
      gunzip.on('error', reject)
      gunzip.write(body)
      gunzip.end()
    })
  }

  if (normalizedEncoding === 'deflate') {
    return new Promise((resolve, reject) => {
      const inflate = createInflate()
      const chunks: Buffer[] = []
      inflate.on('data', (chunk: Buffer) => chunks.push(chunk))
      inflate.on('end', () => {
        const decompressed = Buffer.concat(chunks).toString('utf8')
        resolve({ body: decompressed, wasCompressed: true })
      })
      inflate.on('error', reject)
      inflate.write(body)
      inflate.end()
    })
  }

  if (normalizedEncoding === 'br') {
    return new Promise((resolve, reject) => {
      const brotli = createBrotliDecompress()
      const chunks: Buffer[] = []
      brotli.on('data', (chunk: Buffer) => chunks.push(chunk))
      brotli.on('end', () => {
        const decompressed = Buffer.concat(chunks).toString('utf8')
        resolve({ body: decompressed, wasCompressed: true })
      })
      brotli.on('error', reject)
      brotli.write(body)
      brotli.end()
    })
  }

  return { body: body.toString('utf8'), wasCompressed: false }
}

const parseJsonIfApplicable = (body: string, contentType: string | string[] | undefined): string | object => {
  if (!contentType) {
    return body
  }

  const contentTypeStr = Array.isArray(contentType) ? contentType[0] : contentType
  const normalizedContentType = contentTypeStr.toLowerCase().trim()

  // Check if content type is JSON
  if (normalizedContentType.includes('application/json') || normalizedContentType.includes('text/json')) {
    try {
      return JSON.parse(body)
    } catch (error) {
      // If parsing fails, return as string
      return body
    }
  }

  return body
}

const forwardRequest = async (req: IncomingMessage, res: ServerResponse, targetUrl: string, useProxyMock: boolean): Promise<void> => {
  // Check for mock response first (only if useProxyMock is enabled)
  if (useProxyMock) {
    const mockResponse = await GetMockResponse.getMockResponse(req.method || 'GET', targetUrl)
    if (mockResponse) {
      console.log(`[Proxy] Returning mock response for ${req.method} ${targetUrl}`)
      GetMockResponse.sendMockResponse(res, mockResponse)
      return // Don't record mock requests
    }
  }

  let parsedUrl: URL
  try {
    // In HTTP proxy protocol, the request line contains the full URL
    // e.g., "GET http://example.com/path HTTP/1.1"
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      parsedUrl = new URL(targetUrl)
    } else {
      // Fallback: construct from host header (shouldn't happen in proxy mode)
      const host = req.headers.host || ''
      parsedUrl = new URL(`http://${host}${targetUrl}`)
    }
    // Reduce logging for Azure metadata endpoint (expected to fail when not on Azure)
    const isAzureMetadata = parsedUrl.hostname === '169.254.169.254'
    if (!isAzureMetadata) {
      const portStr = parsedUrl.port ? `:${parsedUrl.port}` : ''
      console.log(`[Proxy] Forwarding ${req.method} ${parsedUrl.protocol}//${parsedUrl.hostname}${portStr}${parsedUrl.pathname}`)
    }
  } catch (error) {
    console.error(`[Proxy] Invalid URL: ${targetUrl}`, error)
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        error: 'Invalid URL',
        message: error instanceof Error ? error.message : 'Failed to parse URL',
        received: targetUrl,
      }),
    )
    return
  }

  const isHttps = parsedUrl.protocol === 'https:'
  const requestModule = isHttps ? httpsRequest : httpRequest

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (isHttps ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: parsedUrl.host,
    },
  }

  // Remove proxy-specific headers
  delete options.headers['proxy-connection']
  delete options.headers['proxy-authorization']

  // Capture request body for POST/PUT/PATCH requests
  const requestBodyChunks: Buffer[] = []

  const proxyReq = requestModule(options, (proxyRes) => {
    console.log(`[Proxy] Forwarding response: ${proxyRes.statusCode} for ${targetUrl}`)
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers)
    const chunks: Buffer[] = []

    proxyRes.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
      res.write(chunk)
    })

    proxyRes.on('end', async () => {
      res.end()
      const responseData = Buffer.concat(chunks)

      // Save POST body if applicable
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const requestBody = Buffer.concat(requestBodyChunks)
        await SavePostBody.savePostBody(req.method, targetUrl, req.headers as Record<string, string>, requestBody)
      }

      SaveRequest.saveRequest(req, res, responseData).catch((err) => {
        console.error('[Proxy] Error saving request:', err)
      })
    })
  })

  proxyReq.on('error', (error) => {
    const errorCode = (error as NodeJS.ErrnoException).code
    // Azure metadata endpoint (169.254.169.254) is expected to fail when not on Azure
    const isAzureMetadata = parsedUrl.hostname === '169.254.169.254'

    // Handle common network errors silently
    if (errorCode === 'EPIPE' || errorCode === 'ECONNRESET' || errorCode === 'ETIMEDOUT' || errorCode === 'ENETUNREACH') {
      if (isAzureMetadata) {
        // Azure metadata endpoint failures are expected when not on Azure
        if (!res.headersSent) {
          res.writeHead(503, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              error: 'Service Unavailable',
              message: 'Azure metadata service not available',
              target: targetUrl,
            }),
          )
        }
        return
      }
      // For other endpoints, handle network errors silently
      if (!res.headersSent) {
        const statusCode = errorCode === 'ETIMEDOUT' || errorCode === 'ENETUNREACH' ? 504 : 500
        res.writeHead(statusCode, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            error: errorCode === 'ETIMEDOUT' ? 'Gateway Timeout' : 'Network Error',
            message:
              errorCode === 'ETIMEDOUT' ? 'Connection timeout' : errorCode === 'ENETUNREACH' ? 'Network unreachable' : 'Connection error',
            target: targetUrl,
          }),
        )
      }
      return
    }

    // Only log unexpected errors
    console.error(`[Proxy] Error forwarding request to ${targetUrl}:`, error)
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          error: 'Proxy forwarding error',
          message: error.message,
          target: targetUrl,
        }),
      )
    }
  })

  // Handle request timeout
  proxyReq.setTimeout(30000, () => {
    const isAzureMetadata = parsedUrl.hostname === '169.254.169.254'

    // Azure metadata endpoint timeouts are expected when not on Azure
    if (isAzureMetadata) {
      if (!res.headersSent) {
        res.writeHead(503, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            error: 'Service Unavailable',
            message: 'Azure metadata service not available',
            target: targetUrl,
          }),
        )
      }
      proxyReq.destroy()
      return
    }

    console.error(`[Proxy] Timeout forwarding request to ${targetUrl}`)
    if (!res.headersSent) {
      res.writeHead(504, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          error: 'Gateway Timeout',
          message: 'Request to target server timed out',
          target: targetUrl,
        }),
      )
    }
    proxyReq.destroy()
  })

  req.on('data', (chunk: Buffer) => {
    // Capture body for POST/PUT/PATCH requests
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      requestBodyChunks.push(chunk)
    }
    // Forward to target server
    proxyReq.write(chunk)
  })

  req.on('end', () => {
    proxyReq.end()
  })
}

const handleConnect = async (req: IncomingMessage, socket: any, head: Buffer, useProxyMock: boolean): Promise<void> => {
  // Handle HTTPS CONNECT requests with TLS termination for inspection
  const target = req.url || ''
  const parts = target.split(':')
  const hostname = parts[0]
  const targetPort = parts[1] ? parseInt(parts[1], 10) : 443

  try {
    // Get certificate for this domain
    const { cert, key } = await CertificateManager.getCertificateForDomain(hostname)
    const secureContext = createSecureContext({
      cert,
      key,
    })

    // Send CONNECT response first
    socket.write('HTTP/1.1 200 Connection Established\r\n\r\n')

    // Create TLS server to terminate the connection
    const { TLSSocket } = await import('tls')
    const tlsSocket = new TLSSocket(socket, {
      secureContext,
      isServer: true,
    })

    // Handle the TLS handshake
    tlsSocket.on('secureConnect', () => {
      console.log(`[Proxy] TLS connection established to ${hostname}:${targetPort}`)
    })

    // Parse HTTP requests from the decrypted stream
    let requestBuffer = Buffer.alloc(0)

    const parseAndProcessRequest = async (): Promise<void> => {
      while (true) {
        // Try to parse HTTP request
        const requestStr = requestBuffer.toString('utf8')
        const requestLineEnd = requestStr.indexOf('\r\n')
        if (requestLineEnd === -1) {
          return // Need more data
        }

        const requestLine = requestStr.substring(0, requestLineEnd)
        const parts = requestLine.split(' ')
        const method = parts[0]
        const path = parts[1]
        const httpVersion = parts[2] || 'HTTP/1.1'

        if (!method || !path) {
          return // Invalid request line
        }

        // Find end of headers
        const headersEnd = requestStr.indexOf('\r\n\r\n')
        if (headersEnd === -1) {
          return // Need more data
        }

        const headersStr = requestStr.substring(requestLineEnd + 2, headersEnd)
        const headers: Record<string, string> = {}
        headersStr.split('\r\n').forEach((line) => {
          const colonIndex = line.indexOf(':')
          if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim().toLowerCase()
            const value = line.substring(colonIndex + 1).trim()
            headers[key] = value
          }
        })

        // Calculate body length
        const bodyStart = headersEnd + 4
        let bodyLength = 0
        const contentLengthHeader = headers['content-length']
        if (contentLengthHeader) {
          bodyLength = parseInt(contentLengthHeader, 10)
          if (isNaN(bodyLength)) {
            bodyLength = 0
          }
        }

        // Check if we have the complete request (headers + body)
        const totalRequestLength = bodyStart + bodyLength
        if (requestBuffer.length < totalRequestLength) {
          return // Need more data
        }

        // Extract body
        const body = requestBuffer.subarray(bodyStart, totalRequestLength)

        // Remove processed request from buffer BEFORE processing (to avoid re-parsing)
        requestBuffer = requestBuffer.subarray(totalRequestLength)

        const fullUrl = `https://${hostname}${path}`
        console.log(`[Proxy] Intercepted HTTPS ${method} ${fullUrl}`)

        // Check for mock response first (only if useProxyMock is enabled)
        if (useProxyMock) {
          const mockResponse = await GetMockResponse.getMockResponse(method, fullUrl)
          if (mockResponse) {
            console.log(`[Proxy] Returning mock response for ${method} ${fullUrl}`)
            const bodyStr = typeof mockResponse.body === 'string' ? mockResponse.body : JSON.stringify(mockResponse.body)
            const bodyBuffer = Buffer.from(bodyStr, 'utf8')

            // Convert headers to the format expected
            const cleanedHeaders: Record<string, string> = {}
            Object.entries(mockResponse.headers).forEach(([k, v]) => {
              cleanedHeaders[k] = Array.isArray(v) ? v.join(', ') : String(v)
            })
            cleanedHeaders['Content-Length'] = String(bodyBuffer.length)

            const statusLine = `${httpVersion} ${mockResponse.statusCode} ${mockResponse.statusCode === 200 ? 'OK' : mockResponse.statusCode === 204 ? 'No Content' : ''}\r\n`
            const headerLines = Object.entries(cleanedHeaders)
              .map(([k, v]) => `${k}: ${v}\r\n`)
              .join('')
            tlsSocket.write(statusLine + headerLines + '\r\n')
            tlsSocket.write(bodyBuffer)
            return // Don't record mock requests
          }
        }

        // Save POST body separately for inspection
        if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
          await SavePostBody.savePostBody(method, fullUrl, headers, body)
        }

        // Forward request to target server
        const targetOptions = {
          hostname,
          port: targetPort,
          path,
          method,
          headers,
          rejectUnauthorized: false,
        }

        const targetReq = httpsRequest(targetOptions, (targetRes) => {
          const responseChunks: Buffer[] = []

          // Buffer the entire response first to handle chunked encoding properly
          targetRes.on('data', (chunk: Buffer) => {
            responseChunks.push(chunk)
          })

          targetRes.on('end', async () => {
            // Save the intercepted request/response
            const responseData = Buffer.concat(responseChunks)
            // Convert headers to Record<string, string | string[]> format
            const responseHeaders: Record<string, string | string[]> = {}
            Object.entries(targetRes.headers).forEach(([k, v]) => {
              if (v !== undefined) {
                responseHeaders[k] = v
              }
            })
            await saveInterceptedRequest(method, fullUrl, headers, targetRes.statusCode || 200, responseHeaders, responseData)

            // Write response back through TLS
            // Remove transfer-encoding header and set content-length instead
            const cleanedHeaders: Record<string, string> = {}
            Object.entries(targetRes.headers).forEach(([k, v]) => {
              const lowerKey = k.toLowerCase()
              // Skip transfer-encoding and connection headers
              if (lowerKey !== 'transfer-encoding' && lowerKey !== 'connection') {
                cleanedHeaders[k] = Array.isArray(v) ? v.join(', ') : String(v)
              }
            })
            // Set content-length
            cleanedHeaders['Content-Length'] = String(responseData.length)

            const statusLine = `${httpVersion} ${targetRes.statusCode} ${targetRes.statusMessage || ''}\r\n`
            const headerLines = Object.entries(cleanedHeaders)
              .map(([k, v]) => `${k}: ${v}\r\n`)
              .join('')
            tlsSocket.write(statusLine + headerLines + '\r\n')
            tlsSocket.write(responseData)
          })

          targetRes.on('error', (error) => {
            const errorCode = (error as NodeJS.ErrnoException).code
            if (errorCode === 'EPIPE' || errorCode === 'ECONNRESET' || errorCode === 'ETIMEDOUT' || errorCode === 'ENETUNREACH') {
              // Send error response back through TLS
              const errorResponse = `${httpVersion} 502 Bad Gateway\r\nContent-Type: application/json\r\nContent-Length: 0\r\n\r\n`
              tlsSocket.write(errorResponse)
              return
            }
            console.error(`[Proxy] Error reading HTTPS response:`, error)
            const errorResponse = `${httpVersion} 502 Bad Gateway\r\nContent-Type: application/json\r\nContent-Length: 0\r\n\r\n`
            tlsSocket.write(errorResponse)
          })
        })

        targetReq.on('error', (error) => {
          const errorCode = (error as NodeJS.ErrnoException).code
          if (errorCode === 'EPIPE' || errorCode === 'ECONNRESET' || errorCode === 'ETIMEDOUT' || errorCode === 'ENETUNREACH') {
            // Send error response back through TLS
            const errorMessage = errorCode === 'ETIMEDOUT' ? 'Gateway Timeout' : 'Bad Gateway'
            const statusCode = errorCode === 'ETIMEDOUT' ? 504 : 502
            const errorBody = JSON.stringify({
              error: errorMessage,
              message: errorCode === 'ETIMEDOUT' ? 'Connection timeout' : 'Connection error',
              target: fullUrl,
            })
            const errorResponse = `${httpVersion} ${statusCode} ${errorMessage}\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(errorBody)}\r\n\r\n${errorBody}`
            tlsSocket.write(errorResponse)
            return
          }
          console.error(`[Proxy] Error forwarding HTTPS request:`, error)
          const errorBody = JSON.stringify({
            error: 'Proxy Error',
            message: error.message,
            target: fullUrl,
          })
          const errorResponse = `${httpVersion} 502 Bad Gateway\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(errorBody)}\r\n\r\n${errorBody}`
          tlsSocket.write(errorResponse)
        })

        // Handle timeout
        targetReq.setTimeout(30000, () => {
          targetReq.destroy()
          const errorBody = JSON.stringify({
            error: 'Gateway Timeout',
            message: 'Request to target server timed out',
            target: fullUrl,
          })
          const errorResponse = `${httpVersion} 504 Gateway Timeout\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(errorBody)}\r\n\r\n${errorBody}`
          tlsSocket.write(errorResponse)
        })

        // Write request body
        if (body.length > 0) {
          targetReq.write(body)
        }
        targetReq.end()
      }
    }

    tlsSocket.on('data', async (data: Buffer) => {
      requestBuffer = Buffer.concat([requestBuffer, data])
      await parseAndProcessRequest()
    })

    tlsSocket.on('error', (error) => {
      const errorCode = (error as NodeJS.ErrnoException).code
      if (errorCode === 'EPIPE' || errorCode === 'ECONNRESET' || errorCode === 'ETIMEDOUT' || errorCode === 'ENETUNREACH') {
        socket.end()
        return
      }
      console.error(`[Proxy] TLS error for ${hostname}:${targetPort}:`, error)
      socket.end()
    })

    socket.on('error', (error) => {
      const errorCode = (error as NodeJS.ErrnoException).code
      if (errorCode === 'EPIPE' || errorCode === 'ECONNRESET' || errorCode === 'ETIMEDOUT' || errorCode === 'ENETUNREACH') {
        tlsSocket.end()
        return
      }
      console.error(`[Proxy] Socket error for ${hostname}:${targetPort}:`, error)
      tlsSocket.end()
    })

    // Write the initial data if any
    if (head.length > 0) {
      tlsSocket.write(head)
    }
  } catch (error) {
    console.error(`[Proxy] Error handling CONNECT for ${hostname}:${targetPort}:`, error)
    socket.end()
  }
}

const saveInterceptedRequest = async (
  method: string,
  url: string,
  requestHeaders: Record<string, string>,
  statusCode: number,
  responseHeaders: Record<string, string | string[]>,
  responseBody: Buffer,
): Promise<void> => {
  try {
    await mkdir(REQUESTS_DIR, { recursive: true })
    const timestamp = Date.now()
    const filename = `${timestamp}_${sanitizeFilename(url)}.json`
    const filepath = join(REQUESTS_DIR, filename)

    const contentEncoding = responseHeaders['content-encoding'] || responseHeaders['Content-Encoding']
    const contentType = responseHeaders['content-type'] || responseHeaders['Content-Type']
    const { body: decompressedBody, wasCompressed } = await decompressBody(responseBody, contentEncoding)

    const parsedBody = parseJsonIfApplicable(decompressedBody, contentType)

    const requestData = {
      timestamp,
      method,
      url,
      headers: requestHeaders,
      response: {
        statusCode,
        headers: responseHeaders,
        body: parsedBody,
        wasCompressed,
      },
    }

    await writeFile(filepath, JSON.stringify(requestData, null, 2), 'utf8')
    console.log(`[Proxy] Saved intercepted HTTPS request to ${filepath}`)
  } catch (error) {
    console.error('[Proxy] Failed to save intercepted request:', error)
  }
}

export const createHttpProxyServer = async (
  options: {
    port?: number
    useProxyMock?: boolean
  } = {},
): Promise<{
  port: number
  url: string
  dispose: () => Promise<void>
}> => {
  const { port = 0, useProxyMock = false } = options
  console.log({ useProxyMock })
  await mkdir(REQUESTS_DIR, { recursive: true })
  await mkdir(join(Root.root, '.vscode-mock-requests'), { recursive: true })

  // Initialize CA certificate for HTTPS inspection
  await CertificateManager.getOrCreateCA()

  const server = createServer()

  server.on('request', (req: IncomingMessage, res: ServerResponse) => {
    const targetUrl = req.url || ''

    // Handle health check endpoint
    if (targetUrl === '/' || targetUrl === '/health' || targetUrl === '/status') {
      const address = server.address()
      const port = address !== null && typeof address === 'object' && 'port' in address ? address.port : 'unknown'
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          status: 'running',
          port,
          timestamp: Date.now(),
        }),
      )
      return
    }

    // For HTTP requests, extract target URL from request line
    // In HTTP proxy protocol, the request line contains the full URL
    // Reduce logging for Azure metadata endpoint (expected to fail when not on Azure)
    const isAzureMetadata = targetUrl.includes('169.254.169.254')
    if (!isAzureMetadata) {
      console.log(`[Proxy] Received ${req.method} request: ${targetUrl}`)
    }

    // If it's not a proxy request (doesn't start with http:// or https://), return error JSON
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          error: 'Invalid proxy request',
          message: 'This is an HTTP proxy server. Requests must use proxy protocol with full URLs.',
          received: targetUrl,
        }),
      )
      return
    }

    forwardRequest(req, res, targetUrl, useProxyMock).catch((error) => {
      console.error('[Proxy] Error in forwardRequest:', error)
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            error: 'Proxy error',
            message: error instanceof Error ? error.message : 'Unknown error',
          }),
        )
      }
    })
  })

  server.on('connect', (req: IncomingMessage, socket: any, head: Buffer) => {
    // Handle CONNECT method for HTTPS tunneling
    const target = req.url || ''
    console.log(`[Proxy] Received CONNECT request: ${target}`)
    handleConnect(req, socket, head, useProxyMock).catch(() => {
      socket.end()
    })
  })

  const { promise, resolve } = Promise.withResolvers<Error | undefined>()
  server.listen(port, '127.0.0.1', () => resolve(undefined))

  const error = await promise
  if (error) {
    throw error
  }

  const address = server.address()
  const actualPort = address !== null && typeof address === 'object' && 'port' in address ? address.port : port
  const url = `http://localhost:${actualPort}`

  console.log(`[Proxy] Proxy server running on http://127.0.0.1:${actualPort}`)
  console.log(`[Proxy] Proxy URL: ${url}`)

  return {
    port: actualPort,
    url,
    async dispose() {
      const { promise, resolve } = Promise.withResolvers<void>()
      server.close(() => resolve())
      await promise
    },
  }
}

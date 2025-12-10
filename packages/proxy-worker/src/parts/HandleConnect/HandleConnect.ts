import { IncomingMessage } from 'http'
import { request as httpsRequest } from 'https'
import { createSecureContext, TLSSocket } from 'tls'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import * as Root from '../Root/Root.ts'
import * as GetMockResponse from '../GetMockResponse/GetMockResponse.ts'
import * as SavePostBody from '../SavePostBody/SavePostBody.ts'
import * as SaveZipData from '../SaveZipData/SaveZipData.ts'
import { getCertificateForDomain } from '../GetCertificateForDomain/GetCertificateForDomain.ts'
import { sanitizeFilename } from '../SanitizeFilename/SanitizeFilename.ts'
import { decompressBody } from '../DecompressBody/DecompressBody.ts'
import { parseJsonIfApplicable } from '../HttpProxyServer/HttpProxyServer.ts'

const REQUESTS_DIR = join(Root.root, '.vscode-requests')

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
    const contentTypeLower = contentType ? (Array.isArray(contentType) ? contentType[0] : contentType).toLowerCase() : ''

    // Handle zip files separately - don't decompress them
    let parsedBody: any
    let wasCompressed = false
    if (contentTypeLower.includes('application/zip')) {
      const zipFilePath = await SaveZipData.saveZipData(responseBody, url, timestamp)
      parsedBody = `file-reference:${zipFilePath}`
    } else {
      const { body: decompressedBody, wasCompressed: wasCompressedResult } = await decompressBody(responseBody, contentEncoding)
      wasCompressed = wasCompressedResult
      parsedBody = parseJsonIfApplicable(decompressedBody, contentType)
    }

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

export const handleConnect = async (req: IncomingMessage, socket: any, head: Buffer, useProxyMock: boolean): Promise<void> => {
  // Handle HTTPS CONNECT requests with TLS termination for inspection
  const target = req.url || ''
  const parts = target.split(':')
  const hostname = parts[0]
  const targetPort = parts[1] ? parseInt(parts[1], 10) : 443

  try {
    // Get certificate for this domain
    const { cert, key } = await getCertificateForDomain(hostname)
    const secureContext = createSecureContext({
      cert,
      key,
    })

    // Send CONNECT response first
    socket.write('HTTP/1.1 200 Connection Established\r\n\r\n')

    // Create TLS server to terminate the connection
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

        // Handle OPTIONS preflight requests for VS Code APIs that need CORS support
        const isMarketplaceApi =
          hostname === 'marketplace.visualstudio.com' || hostname === 'www.vscode-unpkg.net' || hostname === 'github.gallerycdn.vsassets.io'
        if (method === 'OPTIONS' && isMarketplaceApi) {
          const requestedHeaders = headers['access-control-request-headers']
          const requestedMethod = headers['access-control-request-method'] || 'GET'
          const allowHeaders = requestedHeaders
            ? `${requestedHeaders}, x-market-client-id`
            : 'authorization, content-type, accept, x-requested-with, x-market-client-id'

          const corsHeaders = `Access-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: ${requestedMethod || 'GET, POST, PUT, DELETE, PATCH, OPTIONS'}\r\nAccess-Control-Allow-Headers: ${allowHeaders}\r\nAccess-Control-Allow-Credentials: true\r\nAccess-Control-Max-Age: 86400\r\n`
          const statusLine = `${httpVersion} 204 No Content\r\n`
          tlsSocket.write(statusLine + corsHeaders + '\r\n')
          return
        }

        // Check for mock response first (only if useProxyMock is enabled)
        if (useProxyMock) {
          const mockResponse = await GetMockResponse.getMockResponse(method, fullUrl)
          if (mockResponse) {
            console.log(`[Proxy] Returning mock response for ${method} ${fullUrl}`)
            let bodyBuffer: Buffer
            if (mockResponse.body === null || mockResponse.body === undefined) {
              bodyBuffer = Buffer.alloc(0)
            } else if (Buffer.isBuffer(mockResponse.body)) {
              bodyBuffer = mockResponse.body
            } else if (typeof mockResponse.body === 'string') {
              bodyBuffer = Buffer.from(mockResponse.body, 'utf8')
            } else {
              bodyBuffer = Buffer.from(JSON.stringify(mockResponse.body), 'utf8')
            }

            // Convert headers to the format expected and check for existing CORS headers
            const cleanedHeaders: Record<string, string> = {}
            const lowerCaseHeaders: Set<string> = new Set()

            Object.entries(mockResponse.headers).forEach(([k, v]) => {
              const lowerKey = k.toLowerCase()
              // Skip Content-Length headers (case-insensitive) - we'll set it below
              if (lowerKey !== 'content-length') {
                cleanedHeaders[k] = Array.isArray(v) ? v.join(', ') : String(v)
                lowerCaseHeaders.add(lowerKey)
              }
            })

            // Add CORS headers if not already present (case-insensitive check)
            if (!lowerCaseHeaders.has('access-control-allow-origin')) {
              cleanedHeaders['Access-Control-Allow-Origin'] = '*'
            }
            if (!lowerCaseHeaders.has('access-control-allow-methods')) {
              cleanedHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
            }
            if (!lowerCaseHeaders.has('access-control-allow-headers')) {
              const defaultHeaders = isMarketplaceApi
                ? 'authorization, content-type, accept, x-requested-with, x-market-client-id'
                : 'authorization, content-type, accept, x-requested-with'
              cleanedHeaders['Access-Control-Allow-Headers'] = defaultHeaders
            }
            if (!lowerCaseHeaders.has('access-control-allow-credentials')) {
              cleanedHeaders['Access-Control-Allow-Credentials'] = 'true'
            }

            // Always set Content-Length to match actual body length
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
          let saved = false

          const saveAndWriteResponse = async (): Promise<void> => {
            if (saved) {
              return
            }
            saved = true

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
            const lowerCaseHeaders: Set<string> = new Set()
            Object.entries(targetRes.headers).forEach(([k, v]) => {
              const lowerKey = k.toLowerCase()
              // Skip transfer-encoding and connection headers
              if (lowerKey !== 'transfer-encoding' && lowerKey !== 'connection') {
                // Avoid duplicate headers by checking case-insensitively
                if (!lowerCaseHeaders.has(lowerKey)) {
                  cleanedHeaders[k] = Array.isArray(v) ? v.join(', ') : String(v)
                  lowerCaseHeaders.add(lowerKey)
                }
              }
            })

            // Add CORS headers for marketplace API responses
            if (isMarketplaceApi) {
              // Only add CORS headers if they don't already exist
              const lowerCaseCleanedHeaders: Set<string> = new Set()
              Object.keys(cleanedHeaders).forEach((k) => {
                lowerCaseCleanedHeaders.add(k.toLowerCase())
              })

              if (!lowerCaseCleanedHeaders.has('access-control-allow-origin')) {
                cleanedHeaders['Access-Control-Allow-Origin'] = '*'
              }
              if (!lowerCaseCleanedHeaders.has('access-control-allow-credentials')) {
                cleanedHeaders['Access-Control-Allow-Credentials'] = 'true'
              }
              if (!lowerCaseCleanedHeaders.has('access-control-allow-headers')) {
                cleanedHeaders['Access-Control-Allow-Headers'] = 'authorization, content-type, accept, x-requested-with, x-market-client-id'
              }
            }

            // Set content-length
            cleanedHeaders['Content-Length'] = String(responseData.length)

            const statusLine = `${httpVersion} ${targetRes.statusCode} ${targetRes.statusMessage || ''}\r\n`
            const headerLines = Object.entries(cleanedHeaders)
              .map(([k, v]) => `${k}: ${v}\r\n`)
              .join('')
            tlsSocket.write(statusLine + headerLines + '\r\n')
            tlsSocket.write(responseData)
          }

          // Buffer the entire response first to handle chunked encoding properly
          targetRes.on('data', (chunk: Buffer) => {
            responseChunks.push(chunk)
          })

          targetRes.on('end', async () => {
            await saveAndWriteResponse()
          })

          // Also handle 'close' event in case connection closes without 'end'
          // This is important for SSE streams that may never fire 'end'
          targetRes.on('close', async () => {
            if (!saved) {
              await saveAndWriteResponse()
            }
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


import type { IncomingMessage } from 'node:http'
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import { request as httpsRequest } from 'node:https'
import { join } from 'node:path'
import { createSecureContext, TLSSocket } from 'node:tls'
import * as CompressionWorker from '../CompressionWorker/CompressionWorker.ts'
import { CERT_DIR } from '../Constants/Constants.ts'
import { getCertificateForDomain } from '../GetCertificateForDomain/GetCertificateForDomain.ts'
import * as GetMockResponse from '../GetMockResponse/GetMockResponse.ts'
import * as HashRequestBody from '../HashRequestBody/HashRequestBody.ts'
import * as Root from '../Root/Root.ts'
import { sanitizeFilename } from '../SanitizeFilename/SanitizeFilename.ts'
import * as SavePostBody from '../SavePostBody/SavePostBody.ts'
import * as SaveImageData from '../SaveImageData/SaveImageData.ts'
import * as SaveZipData from '../SaveZipData/SaveZipData.ts'
import * as SanitizeFilename from '../SanitizeFilename/SanitizeFilename.ts'
import * as SetCurrentTestName from '../SetCurrentTestName/SetCurrentTestName.ts'

const REQUESTS_DIR = join(Root.root, '.vscode-requests')
const DOMAIN_SANITIZE_REGEX = /[^a-zA-Z0-9]/g

const saveInterceptedRequest = async (
  method: string,
  url: string,
  requestHeaders: Record<string, string>,
  statusCode: number,
  responseHeaders: Record<string, string | string[]>,
  responseBody: Buffer,
  requestBody?: Buffer,
): Promise<void> => {
  try {
    const currentTestName = SetCurrentTestName.getCurrentTestName()
    const testSpecificDir = currentTestName ? join(REQUESTS_DIR, SanitizeFilename.sanitizeFilename(currentTestName)) : REQUESTS_DIR
    await mkdir(testSpecificDir, { recursive: true })
    const timestamp = Date.now()

    // Include body hash in filename for POST/PUT/PATCH requests
    let bodyHash: string | undefined
    let requestBodyData: any
    if (requestBody && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      bodyHash = HashRequestBody.hashRequestBody(requestBody)
      // Try to parse as JSON, otherwise keep as string
      try {
        requestBodyData = JSON.parse(requestBody.toString('utf8'))
      } catch {
        requestBodyData = requestBody.toString('utf8')
      }
    }

    const hashSuffix = bodyHash ? `_${bodyHash}` : ''
    const filename = `${timestamp}_${sanitizeFilename(url)}${hashSuffix}.json`
    const filepath = join(testSpecificDir, filename)

    const contentEncoding = responseHeaders['content-encoding'] || responseHeaders['Content-Encoding']
    const contentType = responseHeaders['content-type'] || responseHeaders['Content-Type']
    const contentTypeLower = contentType ? (Array.isArray(contentType) ? contentType[0] : contentType).toLowerCase() : ''

    // Determine response type and process body accordingly
    let responseType: 'json' | 'zip' | 'binary' | 'text' | 'sse'
    let responseBodyData: string | object | string[]

    if (contentTypeLower.includes('application/zip')) {
      responseType = 'zip'
      const zipFilePath = await SaveZipData.saveZipData(responseBody, url, timestamp, currentTestName || undefined)
      responseBodyData = `file-reference:${zipFilePath}`
    } else if (contentTypeLower.includes('text/event-stream')) {
      responseType = 'sse'
      // Decompress if needed before saving
      const compressionWorker = await CompressionWorker.getCompressionWorker()
      const result = await compressionWorker.invoke('Compression.decompressBody', responseBody, contentEncoding)
      const decompressedBody = result.body

      // Handle Uint8Array (which may be serialized as an array through IPC)
      let bodyString: string
      if (decompressedBody instanceof Uint8Array) {
        bodyString = new TextDecoder().decode(decompressedBody)
      } else if (Array.isArray(decompressedBody)) {
        // Handle case where Uint8Array was serialized as an array through IPC
        bodyString = new TextDecoder().decode(new Uint8Array(decompressedBody))
      } else if (typeof decompressedBody === 'object' && decompressedBody !== null) {
        // Handle case where Buffer was serialized as an object with numeric keys through IPC
        // Convert object like {"0": 123, "1": 10, ...} to Uint8Array
        const keys = Object.keys(decompressedBody)
          .map((k) => Number.parseInt(k, 10))
          .filter((k) => !isNaN(k))
          .sort((a, b) => a - b)
        if (keys.length > 0 && keys[0] === 0 && keys[keys.length - 1] === keys.length - 1) {
          // Looks like a serialized Buffer/Uint8Array
          const numbers = keys.map((k) => (decompressedBody as any)[k] as number)
          bodyString = new TextDecoder().decode(new Uint8Array(numbers))
        } else {
          // Not a serialized buffer, treat as string
          bodyString = String(decompressedBody)
        }
      } else {
        bodyString = String(decompressedBody)
      }

      // Save SSE as array of strings, separated by newlines
      responseBodyData = bodyString.split('\n')
    } else if (contentTypeLower.startsWith('image/')) {
      responseType = 'binary'
      // Decompress if needed before saving
      const compressionWorker = await CompressionWorker.getCompressionWorker()
      const result = await compressionWorker.invoke('Compression.decompressBody', responseBody, contentEncoding)
      const decompressedBody = result.body

      // Convert decompressed body to Buffer
      let imageBuffer: Buffer
      if (decompressedBody instanceof Uint8Array) {
        imageBuffer = Buffer.from(decompressedBody)
      } else if (Array.isArray(decompressedBody)) {
        imageBuffer = Buffer.from(new Uint8Array(decompressedBody))
      } else if (typeof decompressedBody === 'object' && decompressedBody !== null) {
        // Handle case where Buffer was serialized as an object with numeric keys through IPC
        const keys = Object.keys(decompressedBody)
          .map((k) => Number.parseInt(k, 10))
          .filter((k) => !isNaN(k))
          .sort((a, b) => a - b)
        if (keys.length > 0 && keys[0] === 0 && keys[keys.length - 1] === keys.length - 1) {
          const numbers = keys.map((k) => (decompressedBody as any)[k] as number)
          imageBuffer = Buffer.from(new Uint8Array(numbers))
        } else {
          imageBuffer = Buffer.from(String(decompressedBody))
        }
      } else {
        imageBuffer = Buffer.from(String(decompressedBody))
      }

      const imageFilePath = await SaveImageData.saveImageData(imageBuffer, url, timestamp, contentTypeLower)
      responseBodyData = `file-reference:${imageFilePath}`
    } else {
      const compressionWorker = await CompressionWorker.getCompressionWorker()
      const result = await compressionWorker.invoke('Compression.decompressBody', responseBody, contentEncoding)
      const decompressedBody = result.body

      // Handle Uint8Array (which may be serialized as an array through IPC)
      let bodyString: string
      if (decompressedBody instanceof Uint8Array) {
        bodyString = new TextDecoder().decode(decompressedBody)
      } else if (Array.isArray(decompressedBody)) {
        // Handle case where Uint8Array was serialized as an array through IPC
        bodyString = new TextDecoder().decode(new Uint8Array(decompressedBody))
      } else if (typeof decompressedBody === 'object' && decompressedBody !== null) {
        // Handle case where Buffer was serialized as an object with numeric keys through IPC
        // Convert object like {"0": 123, "1": 10, ...} to Uint8Array
        const keys = Object.keys(decompressedBody)
          .map((k) => Number.parseInt(k, 10))
          .filter((k) => !isNaN(k))
          .sort((a, b) => a - b)
        if (keys.length > 0 && keys[0] === 0 && keys[keys.length - 1] === keys.length - 1) {
          // Looks like a serialized Buffer/Uint8Array
          const numbers = keys.map((k) => (decompressedBody as any)[k] as number)
          bodyString = new TextDecoder().decode(new Uint8Array(numbers))
        } else {
          // Not a serialized buffer, treat as string
          bodyString = String(decompressedBody)
        }
      } else {
        bodyString = String(decompressedBody)
      }

      // Check if it's JSON
      if (contentTypeLower.includes('application/json') || contentTypeLower.includes('text/json')) {
        try {
          responseType = 'json'
          responseBodyData = JSON.parse(bodyString)
        } catch {
          // If parsing fails, treat as text
          responseType = 'text'
          // Save plaintext as array of strings, separated by newlines
          responseBodyData = bodyString.split('\n')
        }
      } else {
        responseType = 'text'
        // Save plaintext as array of strings, separated by newlines
        responseBodyData = bodyString.split('\n')
      }
    }

    const requestData = {
      metadata: {
        responseType,
        timestamp,
      },
      request: {
        headers: requestHeaders,
        method,
        url,
        ...(requestBodyData !== undefined && { body: requestBodyData }),
        ...(bodyHash && { bodyHash }),
      },
      response: {
        body: responseBodyData,
        headers: responseHeaders,
        statusCode,
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
  const targetPort = parts[1] ? Number.parseInt(parts[1], 10) : 443

  try {
    // Get certificate for this domain
    let certPair: { cert: string; key: string }
    try {
      certPair = await getCertificateForDomain(hostname)
    } catch (error) {
      console.error(`[Proxy] Error getting certificate for ${hostname}, regenerating...`, error)
      // If there's an error getting the certificate, try to regenerate it
      const certPath = join(CERT_DIR, `${hostname.replaceAll(DOMAIN_SANITIZE_REGEX, '_')}-cert.pem`)
      const keyPath = join(CERT_DIR, `${hostname.replaceAll(DOMAIN_SANITIZE_REGEX, '_')}-key.pem`)
      await Promise.all([unlink(certPath).catch(() => {}), unlink(keyPath).catch(() => {})])
      certPair = await getCertificateForDomain(hostname)
    }

    let secureContext
    try {
      secureContext = createSecureContext({
        cert: certPair.cert,
        key: certPair.key,
      })
    } catch (error) {
      const errorCode = (error as NodeJS.ErrnoException).code
      if (errorCode === 'ERR_OSSL_X509_KEY_VALUES_MISMATCH') {
        // Certificate-key mismatch detected, regenerate
        console.log(`[Proxy] Certificate-key mismatch for ${hostname}, regenerating...`)
        const certPath = join(CERT_DIR, `${hostname.replaceAll(DOMAIN_SANITIZE_REGEX, '_')}-cert.pem`)
        const keyPath = join(CERT_DIR, `${hostname.replaceAll(DOMAIN_SANITIZE_REGEX, '_')}-key.pem`)
        await Promise.all([unlink(certPath).catch(() => {}), unlink(keyPath).catch(() => {})])
        certPair = await getCertificateForDomain(hostname)
        secureContext = createSecureContext({
          cert: certPair.cert,
          key: certPair.key,
        })
      } else {
        throw error
      }
    }

    // Send CONNECT response first
    socket.write('HTTP/1.1 200 Connection Established\r\n\r\n')

    // Create TLS server to terminate the connection
    const tlsSocket = new TLSSocket(socket, {
      isServer: true,
      secureContext,
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

        const requestLine = requestStr.slice(0, Math.max(0, requestLineEnd))
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
        for (const line of headersStr.split('\r\n')) {
          const colonIndex = line.indexOf(':')
          if (colonIndex > 0) {
            const key = line.slice(0, Math.max(0, colonIndex)).trim().toLowerCase()
            const value = line.slice(Math.max(0, colonIndex + 1)).trim()
            headers[key] = value
          }
        }

        // Calculate body length
        const bodyStart = headersEnd + 4
        let bodyLength = 0
        const contentLengthHeader = headers['content-length']
        if (contentLengthHeader) {
          bodyLength = Number.parseInt(contentLengthHeader, 10)
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
          const bodyHash =
            body && (method === 'POST' || method === 'PUT' || method === 'PATCH') ? HashRequestBody.hashRequestBody(body) : undefined
          const mockResponse = await GetMockResponse.getMockResponse(method, fullUrl, bodyHash)
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

            for (const [k, v] of Object.entries(mockResponse.headers)) {
              const lowerKey = k.toLowerCase()
              // Skip Content-Length headers (case-insensitive) - we'll set it below
              // Skip Transfer-Encoding headers - we'll set Content-Length instead
              // Skip Content-Encoding headers - mock body is already decompressed
              if (lowerKey !== 'content-length' && lowerKey !== 'transfer-encoding' && lowerKey !== 'content-encoding') {
                cleanedHeaders[k] = Array.isArray(v) ? v.join(', ') : String(v)
                lowerCaseHeaders.add(lowerKey)
              }
            }

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

            // Explicitly remove Transfer-Encoding and Content-Encoding headers if they somehow got through
            // (case-insensitive check) - we're setting Content-Length, so Transfer-Encoding can't be present
            // Content-Encoding is removed because mock body is already decompressed
            for (const key of Object.keys(cleanedHeaders)) {
              const lowerKey = key.toLowerCase()
              if (lowerKey === 'transfer-encoding' || lowerKey === 'content-encoding') {
                delete cleanedHeaders[key]
                lowerCaseHeaders.delete(lowerKey)
              }
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

        // Forward request to target server
        const targetOptions = {
          headers,
          hostname,
          method,
          path,
          port: targetPort,
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
            for (const [k, v] of Object.entries(targetRes.headers)) {
              if (v !== undefined) {
                responseHeaders[k] = v
              }
            }
            await saveInterceptedRequest(method, fullUrl, headers, targetRes.statusCode || 200, responseHeaders, responseData, body)

            // Save POST body separately for inspection (with response data)
            if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
              await SavePostBody.savePostBody(method, fullUrl, headers, body, {
                responseData,
                responseHeaders,
                statusCode: targetRes.statusCode || 200,
                statusMessage: targetRes.statusMessage,
              })
            }

            // Write response back through TLS
            // Remove transfer-encoding header and set content-length instead
            const cleanedHeaders: Record<string, string> = {}
            const lowerCaseHeaders: Set<string> = new Set()
            for (const [k, v] of Object.entries(targetRes.headers)) {
              const lowerKey = k.toLowerCase()
              // Skip transfer-encoding and connection headers
              if (
                lowerKey !== 'transfer-encoding' &&
                lowerKey !== 'connection' && // Avoid duplicate headers by checking case-insensitively
                !lowerCaseHeaders.has(lowerKey)
              ) {
                cleanedHeaders[k] = Array.isArray(v) ? v.join(', ') : String(v)
                lowerCaseHeaders.add(lowerKey)
              }
            }

            // Add CORS headers for marketplace API responses
            if (isMarketplaceApi) {
              // Only add CORS headers if they don't already exist
              const lowerCaseCleanedHeaders: Set<string> = new Set()
              for (const k of Object.keys(cleanedHeaders)) {
                lowerCaseCleanedHeaders.add(k.toLowerCase())
              }

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

            // Explicitly remove Transfer-Encoding header if it somehow got through
            // (case-insensitive check) - we're setting Content-Length, so Transfer-Encoding can't be present
            for (const key of Object.keys(cleanedHeaders)) {
              if (key.toLowerCase() === 'transfer-encoding') {
                delete cleanedHeaders[key]
                lowerCaseHeaders.delete(key.toLowerCase())
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

          targetRes.on('error', async (error) => {
            const errorCode = (error as NodeJS.ErrnoException).code
            const statusCode = 502
            const statusMessage = 'Bad Gateway'
            const errorResponseBody = Buffer.alloc(0)
            const errorResponseHeaders: Record<string, string | string[]> = {
              'Content-Type': 'application/json',
              'Content-Length': '0',
            }

            // Save the error response
            await saveInterceptedRequest(method, fullUrl, headers, statusCode, errorResponseHeaders, errorResponseBody, body)

            // Save POST body separately for inspection (with error response data)
            if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
              await SavePostBody.savePostBody(method, fullUrl, headers, body, {
                responseData: errorResponseBody,
                responseHeaders: errorResponseHeaders,
                statusCode,
                statusMessage,
              })
            }

            if (errorCode === 'EPIPE' || errorCode === 'ECONNRESET' || errorCode === 'ETIMEDOUT' || errorCode === 'ENETUNREACH') {
              // Send error response back through TLS
              const errorResponse = `${httpVersion} ${statusCode} ${statusMessage}\r\nContent-Type: application/json\r\nContent-Length: 0\r\n\r\n`
              tlsSocket.write(errorResponse)
              return
            }
            console.error(`[Proxy] Error reading HTTPS response:`, error)
            const errorResponse = `${httpVersion} ${statusCode} ${statusMessage}\r\nContent-Type: application/json\r\nContent-Length: 0\r\n\r\n`
            tlsSocket.write(errorResponse)
          })
        })

        targetReq.on('error', async (error) => {
          const errorCode = (error as NodeJS.ErrnoException).code
          let statusCode: number
          let statusMessage: string
          let errorBody: string

          if (errorCode === 'EPIPE' || errorCode === 'ECONNRESET' || errorCode === 'ETIMEDOUT' || errorCode === 'ENETUNREACH') {
            statusMessage = errorCode === 'ETIMEDOUT' ? 'Gateway Timeout' : 'Bad Gateway'
            statusCode = errorCode === 'ETIMEDOUT' ? 504 : 502
            errorBody = JSON.stringify({
              error: statusMessage,
              message: errorCode === 'ETIMEDOUT' ? 'Connection timeout' : 'Connection error',
              target: fullUrl,
            })
          } else {
            statusCode = 502
            statusMessage = 'Bad Gateway'
            errorBody = JSON.stringify({
              error: 'Proxy Error',
              message: error.message,
              target: fullUrl,
            })
            console.error(`[Proxy] Error forwarding HTTPS request:`, error)
          }

          const errorResponseData = Buffer.from(errorBody, 'utf8')
          const errorResponseHeaders: Record<string, string | string[]> = {
            'Content-Type': 'application/json',
            'Content-Length': String(errorResponseData.length),
          }

          // Save the error response
          await saveInterceptedRequest(method, fullUrl, headers, statusCode, errorResponseHeaders, errorResponseData, body)

          // Save POST body separately for inspection (with error response data)
          if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
            await SavePostBody.savePostBody(method, fullUrl, headers, body, {
              responseData: errorResponseData,
              responseHeaders: errorResponseHeaders,
              statusCode,
              statusMessage,
            })
          }

          const errorResponse = `${httpVersion} ${statusCode} ${statusMessage}\r\nContent-Type: application/json\r\nContent-Length: ${errorResponseData.length}\r\n\r\n${errorBody}`
          tlsSocket.write(errorResponse)
        })

        // Handle timeout
        targetReq.setTimeout(30_000, () => {
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

    socket.on('error', (error: Error) => {
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

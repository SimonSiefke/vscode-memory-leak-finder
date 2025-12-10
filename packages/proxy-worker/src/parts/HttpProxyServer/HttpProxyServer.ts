import { createServer, IncomingMessage, ServerResponse } from 'http'
import { request as httpRequest } from 'http'
import { request as httpsRequest } from 'https'
import { URL } from 'url'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import { PassThrough } from 'stream'
import * as Root from '../Root/Root.ts'
import * as GetMockResponse from '../GetMockResponse/GetMockResponse.ts'
import * as SavePostBody from '../SavePostBody/SavePostBody.ts'
import * as SaveRequest from '../SaveRequest/SaveRequest.ts'
import * as GetOrCreateCA from '../GetOrCreateCA/GetOrCreateCA.ts'
import * as HandleConnect from '../HandleConnect/HandleConnect.ts'

const REQUESTS_DIR = join(Root.root, '.vscode-requests')



export const parseJsonIfApplicable = (body: string, contentType: string | string[] | undefined): string | object => {
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

  // Handle OPTIONS preflight requests for VS Code APIs that need CORS support
  const isMarketplaceApi =
    parsedUrl.hostname === 'marketplace.visualstudio.com' ||
    parsedUrl.hostname === 'www.vscode-unpkg.net' ||
    parsedUrl.hostname === 'github.gallerycdn.vsassets.io'
  if (req.method === 'OPTIONS' && isMarketplaceApi) {
    const requestedHeaders = req.headers['access-control-request-headers']
    const requestedMethod = req.headers['access-control-request-method'] || 'GET'
    const allowHeaders = requestedHeaders
      ? `${requestedHeaders}, x-market-client-id`
      : 'authorization, content-type, accept, x-requested-with, x-market-client-id'

    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': requestedMethod || 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': allowHeaders,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    })
    res.end()
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
  delete (options.headers as Record<string, string | string[] | undefined>)['proxy-connection']
  delete (options.headers as Record<string, string | string[] | undefined>)['proxy-authorization']

  // Capture request body for POST/PUT/PATCH requests
  const requestBodyChunks: Buffer[] = []

  const proxyReq = requestModule(options, (proxyRes) => {
    console.log(`[Proxy] Forwarding response: ${proxyRes.statusCode} for ${targetUrl}`)

    // Clean headers - remove Transfer-Encoding and Connection headers
    // Use pipe() which handles encoding properly
    const responseHeaders: Record<string, string | string[]> = {}
    const lowerCaseHeaders: Set<string> = new Set()
    Object.entries(proxyRes.headers).forEach(([k, v]) => {
      if (v !== undefined) {
        const lowerKey = k.toLowerCase()
        // Skip transfer-encoding and connection headers - pipe() will handle encoding
        if (lowerKey !== 'transfer-encoding' && lowerKey !== 'connection') {
          // Avoid duplicate headers by checking case-insensitively
          if (!lowerCaseHeaders.has(lowerKey)) {
            responseHeaders[k] = v
            lowerCaseHeaders.add(lowerKey)
          }
        }
      }
    })

    // Add CORS headers for marketplace API responses
    if (isMarketplaceApi) {
      if (!lowerCaseHeaders.has('access-control-allow-origin')) {
        responseHeaders['Access-Control-Allow-Origin'] = '*'
      }
      if (!lowerCaseHeaders.has('access-control-allow-credentials')) {
        responseHeaders['Access-Control-Allow-Credentials'] = 'true'
      }
      if (!lowerCaseHeaders.has('access-control-allow-headers')) {
        responseHeaders['Access-Control-Allow-Headers'] = 'authorization, content-type, accept, x-requested-with, x-market-client-id'
      }
    }

    res.writeHead(proxyRes.statusCode || 200, responseHeaders)
    const chunks: Buffer[] = []
    let saved = false

    const saveResponseData = async (): Promise<void> => {
      if (saved) {
        return
      }
      saved = true

      const responseData = Buffer.concat(chunks)

      // Convert headers to Record<string, string | string[]> format
      const responseHeaders: Record<string, string | string[]> = {}
      Object.entries(proxyRes.headers).forEach(([k, v]) => {
        if (v !== undefined) {
          responseHeaders[k] = v
        }
      })

      // Save POST body if applicable (with response data)
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const requestBody = Buffer.concat(requestBodyChunks)
        await SavePostBody.savePostBody(req.method, targetUrl, req.headers as Record<string, string>, requestBody, {
          statusCode: proxyRes.statusCode || 200,
          statusMessage: proxyRes.statusMessage,
          responseHeaders,
          responseData,
        })
      }

      SaveRequest.saveRequest(req, proxyRes.statusCode || 200, proxyRes.statusMessage, responseHeaders, responseData).catch((err) => {
        console.error('[Proxy] Error saving request:', err)
      })
    }

    // Use PassThrough to capture data while piping
    // This allows pipe() to handle encoding properly while we capture data
    const captureStream = new PassThrough()
    captureStream.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    // Pipe through capture stream first, then to response
    // pipe() handles Transfer-Encoding automatically
    proxyRes.pipe(captureStream)
    captureStream.pipe(res)

    // Forward errors
    proxyRes.on('error', (err) => {
      captureStream.destroy(err)
    })
    captureStream.on('error', (err) => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Stream error', message: err.message }))
      }
    })

    // Handle end events on proxyRes (source stream)
    proxyRes.on('end', async () => {
      await saveResponseData()
    })

    // Also handle 'close' event in case connection closes without 'end'
    // This is important for SSE streams that may never fire 'end'
    proxyRes.on('close', async () => {
      if (!saved) {
        await saveResponseData()
      }
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
  await GetOrCreateCA.getOrCreateCA()

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
    HandleConnect.handleConnect(req, socket, head, useProxyMock).catch(() => {
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

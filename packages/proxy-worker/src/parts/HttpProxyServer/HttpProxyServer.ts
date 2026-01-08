import type { IncomingMessage, ServerResponse } from 'http';
import { mkdir } from 'fs/promises'
import type { IncomingMessage, ServerResponse } from 'http'
import { mkdir, writeFile } from 'fs/promises'
import { createServer } from 'http'
import { request as httpRequest } from 'http'
import { request as httpsRequest } from 'https'
import { join } from 'path'
import { URL } from 'url'
import * as GetMockResponse from '../GetMockResponse/GetMockResponse.ts'
import * as GetOrCreateCA from '../GetOrCreateCA/GetOrCreateCA.ts'
import * as HandleConnect from '../HandleConnect/HandleConnect.ts'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { join } from 'node:path'
import { URL } from 'node:url'
import * as Root from '../Root/Root.ts'
import * as SavePostBody from '../SavePostBody/SavePostBody.ts'
import * as SaveRequest from '../SaveRequest/SaveRequest.ts'

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
    } catch {
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
  let parsedUrl: URL
  try {
    // In HTTP proxy protocol, the request line contains the full URL
    // e.g., "GET http://example.com/path HTTP/1.1"
    // Normalize http://hostname:443 to https://hostname (some proxy agents send this incorrectly)
    let normalizedUrl = targetUrl
    if (targetUrl.startsWith('http://') && targetUrl.includes(':443')) {
      normalizedUrl = targetUrl.replace('http://', 'https://').replace(':443', '')
    }

    if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) {
      parsedUrl = new URL(normalizedUrl)
    } else {
      // Fallback: construct from host header (shouldn't happen in proxy mode)
      const host = req.headers.host || ''
      parsedUrl = new URL(`http://${host}${normalizedUrl}`)
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
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': allowHeaders,
      'Access-Control-Allow-Methods': requestedMethod || 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': '86400',
    })
    res.end()
    return
  }

  const isHttps = parsedUrl.protocol === 'https:'
  const requestModule = isHttps ? httpsRequest : httpRequest

  const options = {
    headers: {
      ...req.headers,
      host: parsedUrl.host,
    },
    } as Record<string, string | string[] | undefined>,
    hostname: parsedUrl.hostname,
    method: req.method,
    path: parsedUrl.pathname + parsedUrl.search,
    port: parsedUrl.port || (isHttps ? 443 : 80),
  }

  // Remove proxy-specific headers
  delete (options.headers as Record<string, string | string[] | undefined>)['proxy-connection']
  delete (options.headers as Record<string, string | string[] | undefined>)['proxy-authorization']

  // Capture request body for POST/PUT/PATCH requests
  const requestBodyChunks: Buffer[] = []

  const proxyReq = requestModule(options, (proxyRes) => {
    console.log(`[Proxy] Forwarding response: ${proxyRes.statusCode} for ${targetUrl}`)

    // Buffer the entire response first to handle chunked encoding properly
    const responseChunks: Buffer[] = []
    let saved = false

    const saveAndWriteResponse = async (): Promise<void> => {
      if (saved) {
        return
      }
      saved = true

      const responseData = Buffer.concat(responseChunks)

      // Convert headers to Record<string, string | string[]> format for saving
      const responseHeadersForSave: Record<string, string | string[]> = {}
      for (const [k, v] of Object.entries(proxyRes.headers)) {
        if (v !== undefined) {
          responseHeadersForSave[k] = v
        }
      }

      // Clean headers - remove Transfer-Encoding, Connection, and Content-Length headers
      // We'll set Content-Length ourselves based on buffered data to avoid chunked encoding issues
      const responseHeaders: Record<string, string> = {}
      const lowerCaseHeaders: Set<string> = new Set()
      for (const [k, v] of Object.entries(proxyRes.headers)) {
        const lowerKey = k.toLowerCase()
        // Skip transfer-encoding, connection, and content-length headers
        // We'll set Content-Length ourselves based on the buffered data
        if (lowerKey !== 'transfer-encoding' && lowerKey !== 'connection' && lowerKey !== 'content-length' && // Avoid duplicate headers by checking case-insensitively
          !lowerCaseHeaders.has(lowerKey)) {
            responseHeaders[k] = Array.isArray(v) ? v.join(', ') : String(v)
            lowerCaseHeaders.add(lowerKey)
          }
      }

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

      // Explicitly remove Transfer-Encoding header if it somehow got through
      // (case-insensitive check)
      for (const key of Object.keys(responseHeaders)) {
        if (key.toLowerCase() === 'transfer-encoding') {
          delete responseHeaders[key]
        }
      }

      // Set Content-Length to avoid chunked encoding
      responseHeaders['Content-Length'] = String(responseData.length)

      // Write response headers and data
      // Check if headers were already sent (shouldn't happen, but safety check)
      if (res.headersSent) {
        console.error(`[Proxy] Headers already sent for ${targetUrl}, cannot send response`)
      } else {
        res.writeHead(proxyRes.statusCode || 200, responseHeaders)
        res.end(responseData)
      }

      // Save POST body if applicable (with response data)
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const requestBody = Buffer.concat(requestBodyChunks)
        await SavePostBody.savePostBody(req.method, targetUrl, req.headers as Record<string, string>, requestBody, {
          responseData,
          responseHeaders: responseHeadersForSave,
          statusCode: proxyRes.statusCode || 200,
          statusMessage: proxyRes.statusMessage,
        })
      }

      SaveRequest.saveRequest(req, proxyRes.statusCode || 200, proxyRes.statusMessage, responseHeadersForSave, responseData).catch((error) => {
        console.error('[Proxy] Error saving request:', error)
      })
    }

    // Handle errors on the response stream
    proxyRes.on('error', (err) => {
      console.error(`[Proxy] Error receiving response from ${targetUrl}:`, err)
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Response error', message: err.message }))
      }
    })

    // Buffer the entire response first
    proxyRes.on('data', (chunk: Buffer) => {
      responseChunks.push(chunk)
    })

    proxyRes.on('end', async () => {
      await saveAndWriteResponse()
    })

    // Also handle 'close' event in case connection closes without 'end'
    // This is important for SSE streams that may never fire 'end'
    proxyRes.on('close', async () => {
      if (!saved) {
        await saveAndWriteResponse()
      }
    proxyRes.on('end', () => {
      res.end()
      const responseData = Buffer.concat(chunks)
      saveRequest(req, res, responseData).catch((error) => {
        console.error('[Proxy] Error saving request:', error)
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
              errorCode === 'ETIMEDOUT' ? 'Connection timeout' : (errorCode === 'ENETUNREACH' ? 'Network unreachable' : 'Connection error'),
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
  proxyReq.setTimeout(30_000, () => {
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
          port,
          status: 'running',
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
    async [Symbol.asyncDispose](): Promise<void> {
      const { promise, resolve } = Promise.withResolvers<void>()
      server.close(() => resolve())
      await promise
    },
    url,
  }
}

import { createServer, IncomingMessage, ServerResponse } from 'http'
import { request as httpRequest } from 'http'
import { request as httpsRequest } from 'https'
import { URL } from 'url'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import * as Root from '../Root/Root.ts'

const REQUESTS_DIR = join(Root.root, '.vscode-requests')

const sanitizeFilename = (url: string): string => {
  return url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 200)
}

const saveRequest = async (req: IncomingMessage, response: ServerResponse, responseData: Buffer): Promise<void> => {
  try {
    await mkdir(REQUESTS_DIR, { recursive: true })
    const timestamp = Date.now()
    const url = req.url || ''
    const filename = `${timestamp}_${sanitizeFilename(url)}.json`
    const filepath = join(REQUESTS_DIR, filename)

    const requestData = {
      timestamp,
      method: req.method,
      url: req.url,
      headers: req.headers,
      response: {
        statusCode: response.statusCode,
        statusMessage: response.statusMessage,
        headers: response.getHeaders(),
        body: responseData.toString('utf8'),
      },
    }

    await writeFile(filepath, JSON.stringify(requestData, null, 2), 'utf8')
    console.log(`[Proxy] Saved request to ${filepath}`)
  } catch (error) {
    // Ignore errors when saving requests
    console.error('[Proxy] Failed to save request:', error)
  }
}

const saveConnectTunnel = async (hostname: string, port: number): Promise<void> => {
  try {
    await mkdir(REQUESTS_DIR, { recursive: true })
    const timestamp = Date.now()
    const target = `${hostname}:${port}`
    const filename = `${timestamp}_CONNECT_${sanitizeFilename(target)}.json`
    const filepath = join(REQUESTS_DIR, filename)

    const tunnelData = {
      timestamp,
      method: 'CONNECT',
      target,
      hostname,
      port,
      note: 'HTTPS tunnel - actual request/response data is encrypted and cannot be captured',
    }

    await writeFile(filepath, JSON.stringify(tunnelData, null, 2), 'utf8')
    console.log(`[Proxy] Saved CONNECT tunnel to ${filepath}`)
  } catch (error) {
    // Ignore errors when saving tunnel metadata
    console.error('[Proxy] Failed to save CONNECT tunnel:', error)
  }
}

const forwardRequest = (req: IncomingMessage, res: ServerResponse, targetUrl: string): void => {
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
    } as Record<string, string | string[] | undefined>,
  }

  // Remove proxy-specific headers
  delete options.headers['proxy-connection']
  delete options.headers['proxy-authorization']

  const proxyReq = requestModule(options, (proxyRes) => {
    console.log(`[Proxy] Forwarding response: ${proxyRes.statusCode} for ${targetUrl}`)
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers)
    const chunks: Buffer[] = []

    proxyRes.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
      res.write(chunk)
    })

    proxyRes.on('end', () => {
      res.end()
      const responseData = Buffer.concat(chunks)
      saveRequest(req, res, responseData).catch((err) => {
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
    proxyReq.write(chunk)
  })

  req.on('end', () => {
    proxyReq.end()
  })
}

const handleConnect = async (req: IncomingMessage, socket: any, head: Buffer): Promise<void> => {
  // Handle HTTPS CONNECT requests for tunneling
  const target = req.url || ''
  const parts = target.split(':')
  const hostname = parts[0]
  const targetPort = parts[1] ? parseInt(parts[1], 10) : 443

  const { createConnection } = await import('net')
  console.log(`[Proxy] Establishing CONNECT tunnel to ${hostname}:${targetPort}`)
  const proxySocket = createConnection(targetPort, hostname, () => {
    socket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
    if (head.length > 0) {
      proxySocket.write(head)
    }
    proxySocket.pipe(socket)
    socket.pipe(proxySocket)
    console.log(`[Proxy] CONNECT tunnel established to ${hostname}:${targetPort}`)
    // Save tunnel metadata (we can't capture encrypted HTTPS traffic)
    saveConnectTunnel(hostname, targetPort).catch((err) => {
      console.error('[Proxy] Error saving CONNECT tunnel:', err)
    })
  })

  proxySocket.on('error', (error) => {
    // EPIPE, ECONNRESET, ETIMEDOUT, and ENETUNREACH are common network errors
    const errorCode = (error as NodeJS.ErrnoException).code
    if (errorCode === 'EPIPE' || errorCode === 'ECONNRESET' || errorCode === 'ETIMEDOUT' || errorCode === 'ENETUNREACH') {
      // Silently handle expected connection closures and network errors
      socket.end()
      return
    }
    console.error(`[Proxy] CONNECT tunnel error to ${hostname}:${targetPort}:`, error)
    socket.end()
  })

  socket.on('error', (error: Error) => {
    // EPIPE, ECONNRESET, ETIMEDOUT, and ENETUNREACH are common network errors
    const errorCode = (error as NodeJS.ErrnoException).code
    if (errorCode === 'EPIPE' || errorCode === 'ECONNRESET' || errorCode === 'ETIMEDOUT' || errorCode === 'ENETUNREACH') {
      // Silently handle expected connection closures and network errors
      proxySocket.end()
      return
    }
    console.error(`[Proxy] Socket error for ${hostname}:${targetPort}:`, error)
    proxySocket.end()
  })

  // Note: We can't easily capture HTTPS traffic through CONNECT,
  // but HTTP requests will be captured
}

export const createHttpProxyServer = async (
  port: number = 0,
): Promise<{
  port: number
  url: string
  [Symbol.asyncDispose]: () => Promise<void>
}> => {
  await mkdir(REQUESTS_DIR, { recursive: true })

  const server = createServer()

  server.on('request', (req: IncomingMessage, res: ServerResponse) => {
    const targetUrl = req.url || ''

    // Handle health check endpoint
    if (targetUrl === '/' || targetUrl === '/health' || targetUrl === '/status') {
      const address = server.address()
      const port = typeof address === 'object' && address !== null ? address.port : 'unknown'

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

    forwardRequest(req, res, targetUrl)
  })

  server.on('connect', (req: IncomingMessage, socket: any, head: Buffer) => {
    // Handle CONNECT method for HTTPS tunneling
    const target = req.url || ''
    console.log(`[Proxy] Received CONNECT request: ${target}`)
    handleConnect(req, socket, head).catch(() => {
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
  const actualPort = typeof address === 'object' && address !== null ? address.port : port
  const url = `http://localhost:${actualPort}`

  console.log(`[Proxy] Proxy server running on http://127.0.0.1:${actualPort}`)
  console.log(`[Proxy] Proxy URL: ${url}`)

  return {
    port: actualPort,
    url,
    async [Symbol.asyncDispose]() {
      const { promise, resolve } = Promise.withResolvers<void>()
      server.close(() => resolve())
      await promise
    },
  }
}

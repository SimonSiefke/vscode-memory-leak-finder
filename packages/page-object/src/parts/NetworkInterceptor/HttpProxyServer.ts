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
    console.log(`[Proxy] Forwarding ${req.method} ${parsedUrl.protocol}//${parsedUrl.hostname}:${parsedUrl.port}${parsedUrl.pathname}`)
  } catch (error) {
    console.error(`[Proxy] Invalid URL: ${targetUrl}`, error)
    res.writeHead(400)
    res.end(`Invalid URL: ${targetUrl}`)
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
    console.error(`[Proxy] Error forwarding request to ${targetUrl}:`, error)
    if (!res.headersSent) {
      res.writeHead(500)
      res.end(`Proxy error: ${error.message}`)
    }
  })

  // Handle request timeout
  proxyReq.setTimeout(30000, () => {
    console.error(`[Proxy] Timeout forwarding request to ${targetUrl}`)
    if (!res.headersSent) {
      res.writeHead(504)
      res.end('Gateway Timeout')
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
  })

  proxySocket.on('error', (error) => {
    console.error(`[Proxy] CONNECT tunnel error to ${hostname}:${targetPort}:`, error)
    socket.end()
  })

  socket.on('error', (error) => {
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
  dispose: () => Promise<void>
}> => {
  await mkdir(REQUESTS_DIR, { recursive: true })

  const server = createServer()

  server.on('request', (req: IncomingMessage, res: ServerResponse) => {
    // For HTTP requests, extract target URL from request line
    // In HTTP proxy protocol, the request line contains the full URL
    const targetUrl = req.url || ''
    console.log(`[Proxy] Received ${req.method} request: ${targetUrl}`)
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
    async dispose() {
      const { promise, resolve } = Promise.withResolvers<void>()
      server.close(() => resolve())
      await promise
    },
  }
}

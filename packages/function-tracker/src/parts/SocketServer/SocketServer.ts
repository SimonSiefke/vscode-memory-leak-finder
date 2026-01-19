import { createServer, Server, IncomingMessage, ServerResponse } from 'http'
import { readFileSync } from 'node:fs'
import { transformCode } from '../Transform/Transform.ts'

let httpServer: Server | null = null

export const startServer = async (port: number): Promise<void> => {
  const { promise, resolve, reject } = Promise.withResolvers<void>()

  httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      // Only handle GET requests to /transform
      if (req.method !== 'GET' || !req.url) {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end('Not Found')
        return
      }

      const url = new URL(req.url, `http://localhost:${port}`)
      if (url.pathname !== '/transform') {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end('Not Found')
        return
      }

      const fileUrl = url.searchParams.get('url')
      if (!fileUrl) {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('Missing url parameter')
        return
      }

      // Extract file path from URL
      // URL format: vscode-file://vscode-app/path/to/file.js
      if (!fileUrl.startsWith('vscode-file://vscode-app')) {
        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end('')
        return
      }

      let filePath = fileUrl.slice('vscode-file://vscode-app'.length)

      // Remove query parameters (everything after ?)
      const queryIndex = filePath.indexOf('?')
      if (queryIndex !== -1) {
        filePath = filePath.substring(0, queryIndex)
      }

      // Remove hash (everything after #)
      const hashIndex = filePath.indexOf('#')
      if (hashIndex !== -1) {
        filePath = filePath.substring(0, hashIndex)
      }

      // Only transform JavaScript files
      if (!filePath.endsWith('.js')) {
        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end('')
        return
      }

      // Read original file from disk
      let originalCode: string
      try {
        originalCode = readFileSync(filePath, 'utf8')
      } catch (error) {
        console.error(`[HttpServer] Error reading file ${filePath}:`, error)
        res.writeHead(500, { 'Content-Type': 'text/plain' })
        res.end(error instanceof Error ? error.message : 'Failed to read file')
        return
      }

      // Transform code on-the-fly
      try {
        const transformedCode = await transformCode(originalCode, {
          filename: filePath,
          minify: true,
        })

        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end(transformedCode)
      } catch (error) {
        console.error('[HttpServer] Error transforming code:', error)
        res.writeHead(500, { 'Content-Type': 'text/plain' })
        res.end(error instanceof Error ? error.message : 'Server error')
      }
    } catch (error) {
      console.error('[HttpServer] Error handling request:', error)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end(error instanceof Error ? error.message : 'Server error')
    }
  })

  httpServer.on('error', (error) => {
    console.error('[HttpServer] Server error:', error)
    reject(error)
  })

  httpServer.listen(port, () => {
    console.log(`[FunctionTracker] HTTP server listening on port ${port}`)
    resolve()
  })

  await promise
}

export const stopServer = async (): Promise<void> => {
  if (httpServer) {
    const { promise, resolve } = Promise.withResolvers<void>()
    httpServer.close(() => {
      httpServer = null
      resolve()
    })
    await promise
  }
}

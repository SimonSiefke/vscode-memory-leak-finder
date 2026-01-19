import { createServer, Server, IncomingMessage, ServerResponse } from 'http'

let httpServer: Server | null = null

export const startServer = async (port: number): Promise<void> => {
  const { promise, resolve, reject } = Promise.withResolvers<void>()

  httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // HTTP server is kept for compatibility but no longer performs on-the-fly transformation
    // All transformation is done via pre-generation of workbench.desktop.main.js
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
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

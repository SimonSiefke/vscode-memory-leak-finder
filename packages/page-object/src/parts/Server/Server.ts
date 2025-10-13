import { createServer } from 'http'
import { URL } from 'url'

const DEFAULT_PORT = 0

interface ServerInfo {
  readonly url: string
  readonly port: number
}

export const create = ({ VError }) => {
  let mockServer: any = null
  let serverUrl: string = ''

  return {
    async start({ port = DEFAULT_PORT, path = '/mcp' } = {}): Promise<ServerInfo> {
      try {
        if (mockServer) {
          await this.stop()
        }

        mockServer = createServer((req, res) => {
          const parsedUrl = new URL(req.url || '', serverUrl)

          // Log all incoming requests
          console.log(`Mock MCP server received ${req.method} request to ${parsedUrl.pathname}`)
          if (req.method === 'POST') {
            let body = ''
            req.on('data', (chunk) => {
              body += chunk.toString()
            })
            req.on('end', () => {
              console.log('Request body:', body)
            })
          }

          // Handle MCP protocol endpoints
          if (parsedUrl.pathname === path) {
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            })

            // Handle preflight requests
            if (req.method === 'OPTIONS') {
              res.end()
              return
            }

            const response = {
              jsonrpc: '2.0',
              id: 1,
              result: {
                protocolVersion: '2024-11-05',
                capabilities: {
                  tools: {
                    listChanged: true,
                  },
                  resources: {
                    subscribe: true,
                    listChanged: true,
                  },
                  prompts: {
                    listChanged: true,
                  },
                },
                serverInfo: {
                  name: 'mock-mcp-server',
                  version: '1.0.0',
                },
              },
            }

            console.log('Mock MCP server responding with:', JSON.stringify(response, null, 2))
            res.end(JSON.stringify(response))
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Not found' }))
          }
        })

        const { promise, resolve, reject } = Promise.withResolvers<ServerInfo>()

        mockServer.listen(port, (error) => {
          if (error) {
            reject(new VError(error, `Failed to start mock server on port ${port}`))
          } else {
            const address = mockServer.address()
            const actualPort = address?.port || port
            serverUrl = `http://localhost:${actualPort}`
            console.log(`Mock MCP server running on ${serverUrl}`)
            resolve({ url: serverUrl, port: actualPort })
          }
        })

        return promise
      } catch (error) {
        throw new VError(error, `Failed to start mock server`)
      }
    },

    async stop() {
      try {
        if (mockServer) {
          const { promise, resolve } = Promise.withResolvers<void>()

          mockServer.close(() => {
            console.log('Mock MCP server stopped')
            mockServer = null
            serverUrl = ''
            resolve()
          })

          return promise
        }
      } catch (error) {
        throw new VError(error, `Failed to stop mock server`)
      }
    },

    async isRunning() {
      return mockServer !== null
    },

    getUrl() {
      if (!mockServer || !serverUrl) {
        throw new VError(new Error('Server not running'), 'Cannot get URL of stopped server')
      }
      return serverUrl
    },
  }
}

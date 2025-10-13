import { createServer } from 'http'
import { URL } from 'url'

export const create = ({ VError }) => {
  let mockServer: any = null
  const DEFAULT_PORT = 3000

  return {
    async start({ port = DEFAULT_PORT, path = '/mcp' } = {}) {
      try {
        if (mockServer) {
          await this.stop()
        }

        const serverUrl = `http://localhost:${port}`
        
        mockServer = createServer((req, res) => {
          const parsedUrl = new URL(req.url || '', serverUrl)
          
          // Handle MCP protocol endpoints
          if (parsedUrl.pathname === path) {
            res.writeHead(200, { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type'
            })
            
            // Handle preflight requests
            if (req.method === 'OPTIONS') {
              res.end()
              return
            }
            
            res.end(JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              result: {
                protocolVersion: '2024-11-05',
                capabilities: {
                  tools: {
                    listChanged: true
                  },
                  resources: {
                    subscribe: true,
                    listChanged: true
                  },
                  prompts: {
                    listChanged: true
                  }
                },
                serverInfo: {
                  name: 'mock-mcp-server',
                  version: '1.0.0'
                }
              }
            }))
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Not found' }))
          }
        })
        
        return new Promise((resolve, reject) => {
          mockServer.listen(port, (error) => {
            if (error) {
              reject(new VError(error, `Failed to start mock server on port ${port}`))
            } else {
              console.log(`Mock MCP server running on ${serverUrl}`)
              resolve({ url: serverUrl, port })
            }
          })
        })
      } catch (error) {
        throw new VError(error, `Failed to start mock server`)
      }
    },

    async stop() {
      try {
        if (mockServer) {
          return new Promise((resolve) => {
            mockServer.close(() => {
              console.log('Mock MCP server stopped')
              mockServer = null
              resolve()
            })
          })
        }
      } catch (error) {
        throw new VError(error, `Failed to stop mock server`)
      }
    },

    async isRunning() {
      return mockServer !== null
    },

    getUrl() {
      if (!mockServer) {
        throw new VError(new Error('Server not running'), 'Cannot get URL of stopped server')
      }
      return `http://localhost:${mockServer.address()?.port || DEFAULT_PORT}`
    }
  }
}

import { createServer } from 'http'

const DEFAULT_PORT = 0

interface ServerInfo {
  readonly url: string
  readonly port: number
}

export const create = ({ VError }) => {
  let mockServer: any = null
  let serverUrl: string = ''

  return {
    async start({ port = DEFAULT_PORT, requestHandler } = {} as { port?: number; requestHandler?: (req: any, res: any) => void }): Promise<ServerInfo> {
      try {
        if (mockServer) {
          await this.stop()
        }

        mockServer = createServer(requestHandler)

        const { promise, resolve, reject } = Promise.withResolvers<ServerInfo>()

        mockServer.listen(port, (error) => {
          if (error) {
            reject(new VError(error, `Failed to start mock server on port ${port}`))
          } else {
            const address = mockServer.address()
            const actualPort = address?.port || port
            serverUrl = `http://localhost:${actualPort}`
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

import { createServer } from 'http'

const DEFAULT_PORT = 0

interface ServerInfo {
  readonly url: string
  readonly port: number
  readonly dispose: () => Promise<void>
}

export const create = ({ VError }) => {
  return {
    async start({ port = DEFAULT_PORT, requestHandler } = {} as { port?: number; requestHandler?: (req: any, res: any) => void }): Promise<ServerInfo> {
      let mockServer: any = null
      let serverUrl: string = ''

      try {
        mockServer = createServer(requestHandler)

        const { promise, resolve, reject } = Promise.withResolvers<ServerInfo>()

        mockServer.listen(port, (error) => {
          if (error) {
            reject(new VError(error, `Failed to start mock server on port ${port}`))
          } else {
            const address = mockServer.address()
            const actualPort = address?.port || port
            serverUrl = `http://localhost:${actualPort}`
            
            const dispose = async (): Promise<void> => {
              if (mockServer) {
                const { promise: disposePromise, resolve: disposeResolve } = Promise.withResolvers<void>()
                
                mockServer.close(() => {
                  mockServer = null
                  serverUrl = ''
                  disposeResolve()
                })
                
                return disposePromise
              }
            }
            
            resolve({ 
              url: serverUrl, 
              port: actualPort,
              dispose
            })
          }
        })

        return promise
      } catch (error) {
        throw new VError(error, `Failed to start mock server`)
      }
    },
  }
}

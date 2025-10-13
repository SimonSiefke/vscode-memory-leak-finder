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

        const { promise, resolve } = Promise.withResolvers<ServerInfo>()

        mockServer.listen(port, () => {
          const address = mockServer.address()
          const actualPort = typeof address === 'object' && address?.port ? address.port : port
          serverUrl = `http://localhost:${actualPort}`

          const dispose = async (): Promise<void> => {
            if (mockServer) {
              const { promise: disposePromise, resolve: disposeResolve } = Promise.withResolvers<void>()

              mockServer.close(() => {
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
        })

        return promise
      } catch (error) {
        throw new VError(error, `Failed to start mock server`)
      }
    },
  }
}

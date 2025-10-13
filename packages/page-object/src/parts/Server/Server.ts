import { createServer } from 'http'

const DEFAULT_PORT = 0

interface ServerInfo {
  readonly url: string
  readonly port: number
  readonly dispose: () => Promise<void>
}

export const create = ({ VError }) => {
  return {
    async start(
      { port = DEFAULT_PORT, requestHandler } = {} as { port: number; requestHandler?: (req: any, res: any) => void },
    ): Promise<ServerInfo> {
      try {
        let serverUrl: string = ''
        const mockServer = createServer(requestHandler)

        const { promise, resolve } = Promise.withResolvers<Error | undefined>()

        mockServer.listen(port, (error) => resolve(error))

        const error = await promise
        if (error) {
          throw new Error(`Failed to start mock server on port ${port}`)
        }
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

        return {
          url: serverUrl,
          port: actualPort,
          dispose,
        }
      } catch (error) {
        throw new VError(error, `Failed to start mock server`)
      }
    },
  }
}

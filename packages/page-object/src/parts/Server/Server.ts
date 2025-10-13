import { createServer } from 'http'

const DEFAULT_PORT = 0

export interface ServerInfo {
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
        const mockServer = createServer(requestHandler)

        const { promise, resolve } = Promise.withResolvers<Error | undefined>()

        // @ts-ignore
        mockServer.listen(port, (error) => resolve(error))

        const error = await promise
        if (error) {
          throw new Error(`Failed to start mock server on port ${port}`)
        }
        const address = mockServer.address()

        // @ts-ignore
        const actualPort = address?.port || port
        const serverUrl = `http://localhost:${actualPort}`

        return {
          url: serverUrl,
          port: actualPort,
          dispose() {
            const { promise, resolve } = Promise.withResolvers<void>()

            mockServer.close(() => {
              resolve()
            })

            return promise
          },
        }
      } catch (error) {
        throw new VError(error, `Failed to start mock server`)
      }
    },
  }
}

import { NodeWorkerRpcClient } from '@lvce-editor/rpc'
import * as CommandMap from '../CommandMap/CommandMap.ts'
import * as HttpProxyServer from '../HttpProxyServer/HttpProxyServer.ts'

export const main = async (): Promise<void> => {
  const args = process.argv.slice(2)

  if (args.includes('--run-server')) {
    // Start the server directly in standalone mode
    const server = await HttpProxyServer.createHttpProxyServer({
      port: 0,
      useProxyMock: true,
    })

    console.log(`\nProxy server is running on port ${server.port}`)
    console.log('Mock data is enabled')
    console.log('Press Ctrl+C to stop the server\n')

    // Keep the process alive
    process.on('SIGINT', async () => {
      console.log('\nShutting down proxy server...')
      await server[Symbol.asyncDispose]()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      console.log('\nShutting down proxy server...')
      await server[Symbol.asyncDispose]()
      process.exit(0)
    })

    // Prevent the process from exiting
    return new Promise(() => {
      // Keep the process alive indefinitely
    })
  }

  // Default: start as RPC worker
  await NodeWorkerRpcClient.create({
    commandMap: CommandMap.commandMap,
  })
}

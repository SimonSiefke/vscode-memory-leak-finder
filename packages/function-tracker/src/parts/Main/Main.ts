import { NodeForkedProcessRpcClient } from '@lvce-editor/rpc'
import * as CommandMap from '../CommandMap/CommandMap.ts'
import * as HttpServer from '../SocketServer/SocketServer.ts'

const PORT = 9876

export const main = async () => {
  // Start HTTP server for protocol interception
  await HttpServer.startServer(PORT)

  await NodeForkedProcessRpcClient.create({
    commandMap: CommandMap.commandMap,
  })

  // Cleanup on exit
  process.on('exit', async () => {
    await HttpServer.stopServer()
  })
  process.on('SIGINT', async () => {
    await HttpServer.stopServer()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    await HttpServer.stopServer()
    process.exit(0)
  })
}

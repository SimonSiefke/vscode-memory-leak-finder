import { NodeForkedProcessRpcClient } from '@lvce-editor/rpc'
import * as CommandMap from '../CommandMap/CommandMap.ts'
import * as SocketServer from '../SocketServer/SocketServer.ts'

const SOCKET_PATH = '/tmp/function-tracker-socket'

export const main = async () => {
  // Start socket server for protocol interception
  await SocketServer.startSocketServer(SOCKET_PATH)
  
  await NodeForkedProcessRpcClient.create({
    commandMap: CommandMap.commandMap,
  })
  
  // Cleanup on exit
  process.on('exit', async () => {
    await SocketServer.stopSocketServer()
  })
  process.on('SIGINT', async () => {
    await SocketServer.stopSocketServer()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    await SocketServer.stopSocketServer()
    process.exit(0)
  })
}

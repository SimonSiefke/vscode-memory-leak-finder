import { NodeWorkerRpcClient } from '@lvce-editor/rpc'
import * as CliProcess from '../CliProcess/CliProcess.js'
import * as CommandMap from '../CommandMap/CommandMap.js'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.js'

export const listen = async () => {
  Object.assign(CommandMapRef.commandMapRef, CommandMap.commandMap)
  const rpc = await NodeWorkerRpcClient.create({
    commandMap: CommandMapRef.commandMapRef,
  })
  CliProcess.set(rpc)
}

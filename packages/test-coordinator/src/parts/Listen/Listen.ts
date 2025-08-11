import { NodeWorkerRpcClient } from '@lvce-editor/rpc'
import * as CliProcess from '../CliProcess/CliProcess.ts'
import * as CommandMap from '../CommandMap/CommandMap.ts'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'

export const listen = async () => {
  Object.assign(CommandMapRef.commandMapRef, CommandMap.commandMap)
  const rpc = await NodeWorkerRpcClient.create({
    commandMap: CommandMapRef.commandMapRef,
  })
  CliProcess.set(rpc)
}

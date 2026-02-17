import { NodeWorkerRpcClient } from '@lvce-editor/rpc'
import * as CommandMap from '../CommandMap/CommandMap.ts'
import * as ParentProcess from '../ParentProcess/ParentProcess.ts'

export const listen = async (): Promise<void> => {
  const rpc = await NodeWorkerRpcClient.create({
    commandMap: CommandMap.commandMap,
  })
  ParentProcess.setRpc(rpc)
}

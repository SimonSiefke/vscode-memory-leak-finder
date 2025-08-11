import { NodeWorkerRpcClient } from '@lvce-editor/rpc'
import * as CommandMap from '../CommandMap/CommandMap.ts'
import * as ParentProcess from '../ParentProcess/ParentProcess.ts'

export const listen = async (): Promise<void> => {
  const commandMap = await CommandMap.load()
  const rpc = await NodeWorkerRpcClient.create({
    commandMap,
  })
  ParentProcess.setRpc(rpc)
}

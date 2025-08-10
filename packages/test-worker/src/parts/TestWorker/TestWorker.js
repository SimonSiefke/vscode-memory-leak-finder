import { NodeWorkerRpcClient } from '@lvce-editor/rpc'
import * as CommandMap from '../CommandMap/CommandMap.js'
import * as ParentProcess from '../ParentProcess/ParentProcess.js'

export const listen = async () => {
  const commandMap = await CommandMap.load()
  const rpc = await NodeWorkerRpcClient.create({
    commandMap,
  })
  ParentProcess.setRpc(rpc)
}

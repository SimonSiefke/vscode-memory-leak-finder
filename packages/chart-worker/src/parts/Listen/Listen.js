import { NodeWorkerRpcClient } from '@lvce-editor/rpc'
import * as CommandMap from '../CommandMap/CommandMap.js'

export const listen = async () => {
  await NodeWorkerRpcClient.create({
    commandMap: CommandMap.commandMap,
  })
}

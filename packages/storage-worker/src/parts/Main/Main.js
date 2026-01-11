import { NodeWorkerRpcClient } from '@lvce-editor/rpc'
import * as CommandMap from '../CommandMap/CommandMap.js'

export const main = async () => {
  await NodeWorkerRpcClient.create({
    commandMap: CommandMap.commandMap,
  })
}

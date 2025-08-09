import { NodeWorkerRpcClient } from '@lvce-editor/rpc'
import * as CommandMap from '../CommandMap/CommandMap.js'

export const listen = async (): Promise<void> => {
  await NodeWorkerRpcClient.create({
    commandMap: CommandMap.commandMap,
  })
}

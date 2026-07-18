import { NodeForkedProcessRpcClient } from '@lvce-editor/rpc'
import * as CommandMap from '../CommandMap/CommandMap.ts'

export const main = async () => {
  await NodeForkedProcessRpcClient.create({
    commandMap: CommandMap.commandMap,
  })
}

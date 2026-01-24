import { NodeWorkerRpcClient } from '@lvce-editor/rpc'
import * as CommandMap from './parts/CommandMap/CommandMap.ts'

const main = async (): Promise<void> => {
  await NodeWorkerRpcClient.create({
    commandMap: CommandMap.commandMap,
  })
}

main()

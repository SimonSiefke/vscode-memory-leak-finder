import { NodeWorkerRpcClient } from '@lvce-editor/rpc'
import * as CommandMap from '../CommandMap/CommandMap.ts'
import { launchFileSystemWorker } from '../LaunchFileSystemWorker/LaunchFileSystemWorker.ts'

export const listen = async () => {
  await launchFileSystemWorker()
  await NodeWorkerRpcClient.create({
    commandMap: CommandMap.commandMap,
  })
}

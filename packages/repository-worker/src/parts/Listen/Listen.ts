import { NodeWorkerRpcClient } from '@lvce-editor/rpc'
import * as CommandMap from '../CommandMap/CommandMap.js'
import { launchFileSystemWorker } from '../LaunchFileSystemWorker/LaunchFileSystemWorker.js'

export const listen = async () => {
  await launchFileSystemWorker()
  await NodeWorkerRpcClient.create({
    commandMap: CommandMap.commandMap,
  })
}

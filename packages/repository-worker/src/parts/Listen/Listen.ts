import { NodeWorkerRpcClient } from '@lvce-editor/rpc'
import * as CommandMap from '../CommandMap/CommandMap.ts'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import { launchFileSystemWorker } from '../LaunchFileSystemWorker/LaunchFileSystemWorker.ts'

export const listen = async () => {
  await launchFileSystemWorker()
  process.once('disconnect', () => {
    void FileSystemWorker.dispose()
  })
  await NodeWorkerRpcClient.create({
    commandMap: CommandMap.commandMap,
  })
}

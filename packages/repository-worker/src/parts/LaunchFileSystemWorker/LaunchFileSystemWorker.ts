import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import * as FileSystemWorkerPath from '../FileSystemWorkerPath/FileSystemWorkerPath.ts'

export const launchFileSystemWorker = async (): Promise<void> => {
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    path: FileSystemWorkerPath.fileSystemWorkerPath,
  })
  FileSystemWorker.set(rpc)
}


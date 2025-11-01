import { NodeWorkerRpcParent, type Rpc } from '@lvce-editor/rpc'
import * as FileSystemWorkerPath from '../FileSystemWorkerPath/FileSystemWorkerPath.ts'

export const launchFileSystemWorker = async (): Promise<Rpc> => {
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    path: FileSystemWorkerPath.fileSystemWorkerPath,
  })
  return rpc
}

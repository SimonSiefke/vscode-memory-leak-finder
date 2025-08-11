import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import * as FileSystemWorkerPath from '../FileSystemWorkerPath/FileSystemWorkerPath.ts'

export const launchFileSystemWorker = () => {
  const rpc = NodeWorkerRpcParent.create({
    commandMap: {},
    path: FileSystemWorkerPath.fileSystemWorkerPath,
    execArgv: ['--ipc-type="worker-thread"'],
  })
  FileSystemWorker.set(rpc)
  return
}

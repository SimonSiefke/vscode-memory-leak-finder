import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'

export const launchFileSystemWorker = () => {
  const path = '' // TODO
  const rpc = NodeWorkerRpcParent.create({
    commandMap: {},
    path,
    execArgv: ['--ipc-type="worker-thread"'],
  })
  FileSystemWorker.set(rpc)
  return
}

import { NodeForkedProcessRpcParent } from '@lvce-editor/rpc'
import * as HeapSnapshotWorkerPath from '../HeapSnapshotWorkerPath/HeapSnapshotWorkerPath.js'

export const launchHeapSnapshotWorker = async () => {
  const rpc = await NodeForkedProcessRpcParent.create({
    stdio: 'inherit',
    path: HeapSnapshotWorkerPath.heapSnapshotWorkerPath,
    execArgv: ['--max-old-space-size=8192'],
    commandMap: {},
  })
  return rpc
}

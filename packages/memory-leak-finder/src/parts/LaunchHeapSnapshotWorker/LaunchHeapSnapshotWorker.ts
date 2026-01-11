import { NodeForkedProcessRpcParent } from '@lvce-editor/rpc'
import { getNodeMajorVersion } from '../GetNodeVersionMajor/GetNodeVersionMajor.ts'
import * as HeapSnapshotWorkerPath from '../HeapSnapshotWorkerPath/HeapSnapshotWorkerPath.ts'

export const launchHeapSnapshotWorker = async () => {
  const major = getNodeMajorVersion()
  if (major < 24) {
    throw new Error(`node version 24 or higher is required`)
  }
  const rpc = await NodeForkedProcessRpcParent.create({
    commandMap: {},
    execArgv: ['--max-old-space-size=8192'],
    path: HeapSnapshotWorkerPath.heapSnapshotWorkerPath,
    stdio: 'inherit',
  })
  return {
    invoke(method: string, ...params: readonly any[]) {
      return rpc.invoke(method, ...params)
    },
    async [Symbol.asyncDispose]() {
      await rpc.dispose()
    },
  }
}

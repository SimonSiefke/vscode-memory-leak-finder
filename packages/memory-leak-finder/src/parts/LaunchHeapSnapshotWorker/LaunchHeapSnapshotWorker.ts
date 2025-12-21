import { NodeForkedProcessRpcParent } from '@lvce-editor/rpc'
import * as HeapSnapshotWorkerPath from '../HeapSnapshotWorkerPath/HeapSnapshotWorkerPath.ts'
import { getNodeMajorVersion } from '../GetNodeVersionMajor/GetNodeVersionMajor.ts'

export const launchHeapSnapshotWorker = async () => {
  const major = getNodeMajorVersion()
  if (major < 24) {
    throw new Error(`node version 24 or higher is required`)
  }
  const rpc = await NodeForkedProcessRpcParent.create({
    stdio: 'inherit',
    path: HeapSnapshotWorkerPath.heapSnapshotWorkerPath,
    execArgv: ['--max-old-space-size=8192'],
    commandMap: {},
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

import { NodeForkedProcessRpcParent } from '@lvce-editor/rpc'
import * as HeapSnapshotWorkerPath from '../HeapSnapshotWorkerPath/HeapSnapshotWorkerPath.ts'

const getNodeMajorVersion = () => {
  const raw = process.versions.node || ''
  const parts = raw.split('.')
  const first = parts[0]
  const parsed = parseInt(first, 0)
  return parsed
}

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
  return rpc
}

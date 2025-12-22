import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'

export const create = async () => {
  const rpc = await launchHeapSnapshotWorker()
  return rpc
}

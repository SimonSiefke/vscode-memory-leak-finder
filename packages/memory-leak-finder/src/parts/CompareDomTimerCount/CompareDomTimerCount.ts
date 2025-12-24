import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'

export const compareDomTimerCount = async (beforePath: string, afterPath: string, context: any): Promise<any> => {
  await using rpc = await launchHeapSnapshotWorker()
  const { beforeCount, afterCount } = await rpc.invoke('HeapSnapshot.compareDomTimerCount', beforePath, afterPath)
  return {
    before: beforeCount,
    after: afterCount,
  }
}

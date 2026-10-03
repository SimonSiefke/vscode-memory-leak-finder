import type { Dynamic } from '../Types/Types.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
export const compareDomTimerCount = async (beforePath: string, afterPath: string, context: Dynamic): Promise<Dynamic> => {
  await using rpc = await launchHeapSnapshotWorker()
  const { afterCount, beforeCount } = await rpc.invoke('HeapSnapshot.compareDomTimerCount', beforePath, afterPath)
  return {
    after: afterCount,
    before: beforeCount,
  }
}

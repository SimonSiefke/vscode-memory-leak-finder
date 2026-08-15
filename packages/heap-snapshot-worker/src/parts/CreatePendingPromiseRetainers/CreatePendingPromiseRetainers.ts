import { getPendingPromiseRetainers, type PendingPromiseRetainerReport } from '../GetPendingPromiseRetainers/GetPendingPromiseRetainers.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const createPendingPromiseRetainers = async (
  path: string,
  beforeHeapObjectIds: readonly string[],
  afterHeapObjectIds: readonly string[],
  minimumCount = 1,
): Promise<PendingPromiseRetainerReport> => {
  const snapshot = await prepareHeapSnapshot(path, {})
  return getPendingPromiseRetainers(snapshot, beforeHeapObjectIds, afterHeapObjectIds, minimumCount)
}

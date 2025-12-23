import { getDomTimerCountFromHeapSnapshotInternal } from '../GetDomTimerCountFromHeapSnapshotInternal/GetDomTimerCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const compareDomTimerCount = async (beforePath: string, afterPath: string) => {
  const [snapshotBefore, snapshotAfter] = await Promise.all([
    prepareHeapSnapshot(beforePath, {
      parseStrings: true,
    }),
    prepareHeapSnapshot(afterPath, {
      parseStrings: true,
    }),
  ])
  const countBefore = getDomTimerCountFromHeapSnapshotInternal(snapshotBefore)
  const countAfter = getDomTimerCountFromHeapSnapshotInternal(snapshotAfter)
  return {
    beforeCount: countBefore,
    afterCount: countAfter,
  }
}

import { getDomTimerCountFromHeapSnapshotInternal } from '../GetDomTimerCountFromHeapSnapshotInternal/GetDomTimerCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getDomTimerCountFromHeapSnapshot = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getDomTimerCountFromHeapSnapshotInternal(snapshot)
}

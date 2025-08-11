import { getDomTimerCountFromHeapSnapshotInternal } from '../GetDomTimerCountFromHeapSnapshotInternal/GetDomTimerCountFromHeapSnapshotInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

export const getDomTimerCountFromHeapSnapshot = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getDomTimerCountFromHeapSnapshotInternal(snapshot)
}

import { getV8EventListenerCountFromHeapSnapshotInternal } from '../GetV8EventListenerCountFromHeapSnapshotInternal/GetV8EventListenerCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getV8EventListenerCountFromHeapSnapshot = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getV8EventListenerCountFromHeapSnapshotInternal(snapshot)
}

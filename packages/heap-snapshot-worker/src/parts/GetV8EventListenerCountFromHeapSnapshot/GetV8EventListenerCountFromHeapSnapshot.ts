import { getV8EventListenerCountFromHeapSnapshotInternal } from '../GetV8EventListenerCountFromHeapSnapshotInternal/GetV8EventListenerCountFromHeapSnapshotInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

export const getV8EventListenerCountFromHeapSnapshot = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getV8EventListenerCountFromHeapSnapshotInternal(snapshot)
}

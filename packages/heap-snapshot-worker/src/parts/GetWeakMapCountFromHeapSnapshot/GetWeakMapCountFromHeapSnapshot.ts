import { getWeakMapCountFromHeapSnapshotInternal } from '../GetWeakMapCountFromHeapSnapshotInternal/GetWeakMapCountFromHeapSnapshotInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import type { Snapshot } from '../Snapshot/Snapshot.js'

export const getWeakMapCountFromHeapSnapshot = async (path: string): Promise<number> => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getWeakMapCountFromHeapSnapshotInternal(snapshot)
}

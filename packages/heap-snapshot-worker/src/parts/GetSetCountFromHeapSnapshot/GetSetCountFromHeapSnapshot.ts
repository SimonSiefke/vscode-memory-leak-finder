import { getSetCountFromHeapSnapshotInternal } from '../GetSetCountFromHeapSnapshotInternal/GetSetCountFromHeapSnapshotInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import type { Snapshot } from '../Snapshot/Snapshot.js'

export const getSetCountFromHeapSnapshot = async (path: string): Promise<number> => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getSetCountFromHeapSnapshotInternal(snapshot)
}

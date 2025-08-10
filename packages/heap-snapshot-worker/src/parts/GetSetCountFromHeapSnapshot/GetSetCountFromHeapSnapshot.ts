import { getSetCountFromHeapSnapshotInternal } from '../GetSetCountFromHeapSnapshotInternal/GetSetCountFromHeapSnapshotInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const getSetCountFromHeapSnapshot = async (pathUri: string): Promise<number> => {
  const snapshot: Snapshot = await prepareHeapSnapshot(pathUri, {
    parseStrings: true,
  })
  return getSetCountFromHeapSnapshotInternal(snapshot)
}

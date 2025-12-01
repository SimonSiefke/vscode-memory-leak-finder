import { getTypeCount } from '../GetTypeCount/GetTypeCount.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const getRegexCountFromHeapSnapshotInternal = (snapshot: Snapshot): number => {
  return getTypeCount(snapshot, 'regexp')
}

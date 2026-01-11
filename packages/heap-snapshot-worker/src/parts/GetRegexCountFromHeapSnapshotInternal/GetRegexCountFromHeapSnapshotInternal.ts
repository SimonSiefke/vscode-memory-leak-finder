import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { getTypeCount } from '../GetTypeCount/GetTypeCount.ts'

export const getRegexCountFromHeapSnapshotInternal = (snapshot: Snapshot): number => {
  return getTypeCount(snapshot, 'regexp')
}

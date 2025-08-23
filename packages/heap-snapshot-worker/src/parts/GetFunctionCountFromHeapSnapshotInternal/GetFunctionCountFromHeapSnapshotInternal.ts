import { getTypeCount } from '../GetTypeCount/GetTypeCount.ts'
import { Snapshot } from '../Snapshot/Snapshot.ts'

export const getFunctionCountFromHeapSnapshotInternal = (snapshot: Snapshot): number => {
  return getTypeCount(snapshot, 'closure')
}

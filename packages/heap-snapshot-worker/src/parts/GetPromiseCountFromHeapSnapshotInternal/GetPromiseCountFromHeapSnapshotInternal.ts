import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.ts'

export const getPromiseCountFromHeapSnapshotInternal = (snapshot: Snapshot): number => {
  const count = getThingCountFromHeapSnapshot(snapshot, 'object', 'Promise')
  return count
}

import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const getPromiseCountFromHeapSnapshotInternal = (snapshot: Snapshot): number => {
  const count = getThingCountFromHeapSnapshot(snapshot, 'object', 'Promise')
  return count
}

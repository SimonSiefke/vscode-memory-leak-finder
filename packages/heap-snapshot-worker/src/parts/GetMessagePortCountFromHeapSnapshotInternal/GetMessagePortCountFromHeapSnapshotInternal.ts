import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.ts'

export const getMessagePortCountFromHeapSnapshotInternal = (snapshot: Snapshot): number => {
  const count = getThingCountFromHeapSnapshot(snapshot, 'object', 'MessagePort')
  return count
}

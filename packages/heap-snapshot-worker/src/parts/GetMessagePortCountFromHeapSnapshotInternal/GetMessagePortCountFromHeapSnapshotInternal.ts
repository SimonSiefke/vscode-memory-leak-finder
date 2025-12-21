import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const getMessagePortCountFromHeapSnapshotInternal = (snapshot: Snapshot): number => {
  const count = getThingCountFromHeapSnapshot(snapshot, 'object', 'MessagePort')
  return count
}

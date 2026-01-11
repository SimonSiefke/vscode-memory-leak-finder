import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.ts'

export const getWeakMapCountFromHeapSnapshotInternal = (snapshot: Snapshot): number => {
  return getThingCountFromHeapSnapshot(snapshot, 'object', 'WeakMap')
}

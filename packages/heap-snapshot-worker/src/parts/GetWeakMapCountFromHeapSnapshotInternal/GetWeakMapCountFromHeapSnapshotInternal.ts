import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const getWeakMapCountFromHeapSnapshotInternal = (snapshot: Snapshot): number => {
  return getThingCountFromHeapSnapshot(snapshot, 'object', 'WeakMap')
}

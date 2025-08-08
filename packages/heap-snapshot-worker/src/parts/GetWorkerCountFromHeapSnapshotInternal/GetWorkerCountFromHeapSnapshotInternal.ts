import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.js'
import { Snapshot } from '../Snapshot/Snapshot.ts'

export const getWorkerCountFromHeapSnapshotInternal = (snapshot: Snapshot): number => {
  return getThingCountFromHeapSnapshot(snapshot, 'object', 'Worker.prototype')
}

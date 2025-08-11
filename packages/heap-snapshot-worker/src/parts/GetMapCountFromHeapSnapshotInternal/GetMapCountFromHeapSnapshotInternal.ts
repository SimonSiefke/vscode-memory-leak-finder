import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.js'

export const getMapCountFromHeapSnapshotInternal = (snapshot) => {
  return getThingCountFromHeapSnapshot(snapshot, 'object', 'Map')
}

import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.ts'

export const getMapCountFromHeapSnapshotInternal = (snapshot: any) => {
  return getThingCountFromHeapSnapshot(snapshot, 'object', 'Map')
}

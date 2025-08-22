import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.ts'
import { Snapshot } from '../Snapshot/Snapshot.ts'

export const getV8EventListenerCountFromHeapSnapshotInternal = (snapshot: Snapshot): number => {
  return getThingCountFromHeapSnapshot(snapshot, 'native', 'V8EventListener')
}

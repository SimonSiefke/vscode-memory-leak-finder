import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.ts'
import { Snapshot } from '../Snapshot/Snapshot.ts'

export const getTextDecoderCountFromHeapSnapshotInternal = (snapshot: Snapshot): number => {
  return getThingCountFromHeapSnapshot(snapshot, 'object', 'TextDecoder.prototype')
}

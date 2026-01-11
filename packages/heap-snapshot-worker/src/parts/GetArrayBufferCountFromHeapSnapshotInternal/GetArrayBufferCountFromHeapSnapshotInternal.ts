import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.ts'

export const getArrayBufferCountFromHeapSnapshotInternal = (snapshot: Snapshot) => {
  const arrayBufferCount = getThingCountFromHeapSnapshot(snapshot, 'object', 'ArrayBuffer')
  const float32ArrayCount = getThingCountFromHeapSnapshot(snapshot, 'object', 'Float32Array')
  return arrayBufferCount + float32ArrayCount
}

import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const getArrayBufferCountFromHeapSnapshotInternal = (snapshot: Snapshot) => {
  const arrayBufferCount = getThingCountFromHeapSnapshot(snapshot, 'object', 'ArrayBuffer')
  const float32ArrayCount = getThingCountFromHeapSnapshot(snapshot, 'object', 'Float32Array')
  return arrayBufferCount + float32ArrayCount
}

import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.ts'

/**
 *
 * @param {any} snapshot
 * @returns {number}
 */
export const getArrayBufferCountFromHeapSnapshotInternal = (snapshot) => {
  const arrayBufferCount = getThingCountFromHeapSnapshot(snapshot, 'object', 'ArrayBuffer')
  const float32ArrayCount = getThingCountFromHeapSnapshot(snapshot, 'object', 'Float32Array')

  return arrayBufferCount + float32ArrayCount
}

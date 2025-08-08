import { getThingCountFromHeapSnapshotInternal } from '../GetObjectCountFromHeapSnapshotInternal/GetThingCountFromHeapSnapshotInternal.js'

/**
 *
 * @param {any} snapshot
 * @returns {number}
 */
export const getArrayBufferCountFromHeapSnapshotInternal = (snapshot) => {
  return getThingCountFromHeapSnapshotInternal(snapshot, 'object', 'ArrayBuffer')
}

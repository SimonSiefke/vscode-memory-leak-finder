import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.js'

/**
 *
 * @param {any} snapshot
 * @returns {number}
 */
export const getWeakMapCountFromHeapSnapshotInternal = (snapshot) => {
  return getThingCountFromHeapSnapshot(snapshot, 'object', 'WeakMap')
}

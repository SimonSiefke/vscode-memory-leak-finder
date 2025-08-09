import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.js'

/**
 *
 * @param {any} snapshot
 * @returns {number}
 */
export const getSetCountFromHeapSnapshotInternal = (snapshot) => {
  return getThingCountFromHeapSnapshot(snapshot, 'object', 'Set')
}

import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.js'

/**
 *
 * @param {any} snapshot
 * @returns {number}
 */
export const getEditContextCountFromHeapSnapshotInternal = (snapshot) => {
  return getThingCountFromHeapSnapshot(snapshot, 'object', 'EditContext')
}

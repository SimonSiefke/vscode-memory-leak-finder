import { getTypeCount } from '../GetTypeCount/GetTypeCount.js'

/**
 *
 * @param {any} snapshot
 * @returns {number}
 */
export const getFunctionCountFromHeapSnapshotInternal = (snapshot) => {
  return getTypeCount(snapshot, 'closure')
}

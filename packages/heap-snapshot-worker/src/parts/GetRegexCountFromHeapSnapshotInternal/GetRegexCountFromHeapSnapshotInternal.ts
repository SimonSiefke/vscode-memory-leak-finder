import { getTypeCount } from '../GetTypeCount/GetTypeCount.js'

/**
 *
 * @param {any} snapshot
 * @returns {number}
 */
export const getRegexCountFromHeapSnapshotInternal = (snapshot) => {
  return getTypeCount(snapshot, 'regexp')
}

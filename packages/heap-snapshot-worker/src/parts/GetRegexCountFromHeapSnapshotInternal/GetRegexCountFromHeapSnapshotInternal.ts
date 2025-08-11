import { getTypeCount } from '../GetTypeCount/GetTypeCount.ts'

/**
 *
 * @param {any} snapshot
 * @returns {number}
 */
export const getRegexCountFromHeapSnapshotInternal = (snapshot) => {
  return getTypeCount(snapshot, 'regexp')
}

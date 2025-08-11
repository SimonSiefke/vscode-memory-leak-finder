import { getTypeCount } from '../GetTypeCount/GetTypeCount.ts'

/**
 *
 * @param {any} snapshot
 * @returns {number}
 */
export const getFunctionCountFromHeapSnapshotInternal = (snapshot) => {
  return getTypeCount(snapshot, 'closure')
}

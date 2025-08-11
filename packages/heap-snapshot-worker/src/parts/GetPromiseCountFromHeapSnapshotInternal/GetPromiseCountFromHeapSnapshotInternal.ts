import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.ts'

/**
 *
 * @param {any} snapshot
 * @returns {number}
 */
export const getPromiseCountFromHeapSnapshotInternal = (snapshot) => {
  console.time('ag')
  const count = getThingCountFromHeapSnapshot(snapshot, 'object', 'Promise')
  console.timeEnd('ag')
  return count
}

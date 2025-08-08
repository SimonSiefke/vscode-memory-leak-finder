import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.js'

/**
 *
 * @param {any} snapshot
 * @returns {number}
 */
export const getV8EventListenerCountFromHeapSnapshotInternal = (snapshot) => {
  return getThingCountFromHeapSnapshot(snapshot, 'native', 'V8EventListener')
}

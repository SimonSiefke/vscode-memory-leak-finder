import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.ts'

/**
 *
 * @param {Snapshot} snapshot
 * @returns {number}
 */
export const getMediaQueryListCountFromHeapSnapshotInternal = (snapshot: Snapshot): number => {
  const mediaQueryListCount = getThingCountFromHeapSnapshot(snapshot, 'object', 'MediaQueryList')
  return mediaQueryListCount
}

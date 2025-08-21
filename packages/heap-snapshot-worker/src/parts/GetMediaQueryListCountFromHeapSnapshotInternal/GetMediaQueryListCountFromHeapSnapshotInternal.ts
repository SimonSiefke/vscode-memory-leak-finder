import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

/**
 *
 * @param {Snapshot} snapshot
 * @returns {number}
 */
export const getMediaQueryListCountFromHeapSnapshotInternal = (snapshot: Snapshot): number => {
  const mediaQueryListCount = getThingCountFromHeapSnapshot(snapshot, 'object', 'MediaQueryList')
  return mediaQueryListCount
}

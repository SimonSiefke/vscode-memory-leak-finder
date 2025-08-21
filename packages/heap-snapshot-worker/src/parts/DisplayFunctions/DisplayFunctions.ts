import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.ts'
import { getUniqueLocationMap } from '../GetUniqueLocationMap/GetUniqueLocationMap.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const displayHeapSnapshotFunctions = async (snapshot: Snapshot): Promise<any[]> => {
  const { itemsPerLocation, scriptIdOffset, lineOffset, columnOffset } = getLocationFieldOffsets(snapshot.meta.location_fields)
  const map = getUniqueLocationMap(snapshot.locations, itemsPerLocation, scriptIdOffset, lineOffset, columnOffset)
  return map
}

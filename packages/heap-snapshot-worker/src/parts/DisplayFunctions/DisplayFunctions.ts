import { compareHeapSnapshotFunctionsInternal } from '../CompareHeapSnapshotsFunctionsInternal/CompareHeapSnapshotsFunctionsInternal.ts'
import { getUniqueLocationMap } from '../GetUniqueLocationMap/GetUniqueLocationMap.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'
import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.ts'
import { Snapshot } from '../Snapshot/Snapshot.ts'

export const displayHeapSnapshotFunctions = async (snapshot: Snapshot): Promise<any[]> => {
  const { itemsPerLocation, scriptIdOffset, lineOffset, columnOffset } = getLocationFieldOffsets(snapshot.meta.location_fields)
  const map = getUniqueLocationMap(snapshot.locations, itemsPerLocation, scriptIdOffset, lineOffset, columnOffset)
  return {
    locations: snapshot.locations,
    meta: snapshot.meta,
    map,
  }
}

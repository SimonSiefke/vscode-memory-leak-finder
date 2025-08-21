import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.ts'
import { getUniqueLocationMap } from '../GetUniqueLocationMap/GetUniqueLocationMap.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import type { UniqueLocationMap } from '../UniqueLocationMap/UniqueLocationMap.ts'

export const displayHeapSnapshotFunctions = async (snapshot: Snapshot): Promise<UniqueLocationMap> => {
  const { itemsPerLocation, scriptIdOffset, lineOffset, columnOffset } = getLocationFieldOffsets(snapshot.meta.location_fields)
  const toNodeIndex = snapshot.meta.location_fields.indexOf('object_index')
  const nodeNameIndex = snapshot.meta.node_fields.indexOf('name')
  const nodeFieldCount = snapshot.meta.node_fields.length
  console.log({ toNodeIndex, nodeNameIndex })
  const map = getUniqueLocationMap(
    snapshot.locations,
    itemsPerLocation,
    scriptIdOffset,
    lineOffset,
    columnOffset,
    toNodeIndex,
    nodeNameIndex,
    nodeFieldCount,
    snapshot.nodes,
    snapshot.strings,
  )
  return map
}

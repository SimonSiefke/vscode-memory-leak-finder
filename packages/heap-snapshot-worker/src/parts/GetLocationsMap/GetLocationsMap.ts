import type { Snapshot } from '../Snapshot/Snapshot.ts'

/**
 * Maps nodes index (not multiplied) to location index (multiplied by location_fields.length).
 */
export const getLocationsMap = (snapshot: Snapshot): Uint32Array => {
  const locationFieldCount = snapshot.meta.location_fields.length
  const nodeFieldCount = snapshot.meta.node_fields.length
  const locations = snapshot.locations
  const indexOffset = snapshot.meta.location_fields.indexOf('object_index')
  if (indexOffset === -1) {
    throw new Error('index not found')
  }
  const locationMap = new Uint32Array(snapshot.nodes.length / nodeFieldCount)
  for (let i = 0; i < locations.length; i += locationFieldCount) {
    locationMap[locations[i + indexOffset]] = i
  }
  return locationMap
}

import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const getLocationsMap = (snapshot: Snapshot, indices: readonly number[]): Uint32Array => {
  if (indices.length === 0) {
    return new Uint32Array([])
  }
  const locationFieldCount = snapshot.meta.location_fields.length
  const nodeFieldCount = snapshot.meta.node_fields.length
  const locations = snapshot.locations
  const indexOffset = snapshot.meta.location_fields.indexOf('object_index')
  if (indexOffset === -1) {
    throw new Error('index not found')
  }
  const locationMap = new Uint32Array(snapshot.nodes.length / nodeFieldCount)
  for (let i = 0; i < locations.length; i += locationFieldCount) {
    locationMap[locations[i]] = i
  }
  return locationMap
}

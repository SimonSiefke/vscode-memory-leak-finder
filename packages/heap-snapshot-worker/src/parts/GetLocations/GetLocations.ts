import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const getLocations = (snapshot: Snapshot, indices: readonly number[]): readonly number[] => {
  if (indices.length === 0) {
    return []
  }
  const locationFieldCount = snapshot.meta.location_fields.length
  const nodeFieldCount = snapshot.meta.node_fields.length
  const locations = snapshot.locations
  const indexOffset = snapshot.meta.location_fields.indexOf('object_index')
  if (indexOffset === -1) {
    throw new Error('index not found')
  }
  let indicesIndex = 0
  const scriptLocations: number[] = []
  for (let i = 0; i < locations.length; i += locationFieldCount) {
    const nodeIndex = indices[indicesIndex] * nodeFieldCount
    const locationNodeIndex = locations[i + indexOffset]
    if (nodeIndex === locationNodeIndex) {
      scriptLocations.push(i)
      indicesIndex++
    }
  }
  return scriptLocations
}

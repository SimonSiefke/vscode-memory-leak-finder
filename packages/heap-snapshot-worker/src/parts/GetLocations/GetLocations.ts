import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const getLocations = (snapshot: Snapshot, indices: readonly number[], locations: Uint32Array): Uint32Array => {
  const scriptIdOffset = snapshot.meta.location_fields.indexOf('script_id')
  const lineOffset = snapshot.meta.location_fields.indexOf('line')
  const columnOffset = snapshot.meta.location_fields.indexOf('column')
  const numbers = new Uint32Array(indices.length * 3)
  for (let i = 0; i < indices.length; i++) {
    const locationIndex = locations[indices[i]]
    const scriptId = locations[locationIndex + scriptIdOffset]
    if (scriptId === 0) {
      console.log('index', i, 'value', indices[i])
      throw new Error('impossible, index')
    }
    const line = locations[locationIndex + lineOffset]
    const column = locations[locationIndex + columnOffset]
    numbers[i * 3] = scriptId
    numbers[i * 3 + 1] = line
    numbers[i * 3 + 2] = column
  }
  return numbers
}

import * as Assert from '../Assert/Assert.ts'
import type { NumberArray } from '../Snapshot/Snapshot.ts'

export interface ParsedLocation {
  readonly columnIndex: number
  readonly lineIndex: number
  readonly objectIndex: number
  readonly scriptIdIndex: number
}

export const parseHeapSnapshotLocations = (
  locations: NumberArray,
  locationFields: readonly string[],
  nodeFieldCount: number,
): ParsedLocation[] => {
  // Assert.array(locations)
  Assert.array(locationFields)
  Assert.number(nodeFieldCount)
  const objectIndexIndex = locationFields.indexOf('object_index')
  const scriptIdIndexIndex = locationFields.indexOf('script_id')
  const lineIndexIndex = locationFields.indexOf('line')
  const columnIndexIndex = locationFields.indexOf('column')
  const fieldCount = locationFields.length
  const parsedLocations: ParsedLocation[] = []
  for (let i = 0; i < locations.length; i += fieldCount) {
    const objectIndex = locations[i + objectIndexIndex] / nodeFieldCount
    const scriptIdIndex = locations[i + scriptIdIndexIndex]
    const lineIndex = locations[i + lineIndexIndex]
    const columnIndex = locations[i + columnIndexIndex]
    parsedLocations.push({
      columnIndex,
      lineIndex,
      objectIndex,
      scriptIdIndex,
    })
  }
  return parsedLocations
}

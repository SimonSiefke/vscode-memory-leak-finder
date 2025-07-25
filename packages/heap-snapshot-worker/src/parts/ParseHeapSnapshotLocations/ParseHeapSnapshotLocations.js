import * as Assert from '../Assert/Assert.js'

export const parseHeapSnapshotLocations = (locations, locationFields, nodeFieldCount) => {
  Assert.array(locations)
  Assert.array(locationFields)
  Assert.number(nodeFieldCount)
  const objectIndexIndex = locationFields.indexOf('object_index')
  const scriptIdIndexIndex = locationFields.indexOf('script_id')
  const lineIndexIndex = locationFields.indexOf('line')
  const columnIndexIndex = locationFields.indexOf('column')
  const fieldCount = locationFields.length
  const parsedLocations = []
  for (let i = 0; i < locations.length; i += fieldCount) {
    const objectIndex = locations[i + objectIndexIndex] / nodeFieldCount
    const scriptIdIndex = locations[i + scriptIdIndexIndex]
    const lineIndex = locations[i + lineIndexIndex]
    const columnIndex = locations[i + columnIndexIndex]
    parsedLocations.push({
      objectIndex,
      scriptIdIndex,
      lineIndex,
      columnIndex,
    })
  }
  return parsedLocations
}

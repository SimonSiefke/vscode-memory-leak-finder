import * as Assert from '../Assert/Assert.js'

export const getLocationFieldOffsets = (locationFields) => {
  Assert.array(locationFields)
  const objectIndexOffset = locationFields.indexOf('object_index')
  const scriptIdOffset = locationFields.indexOf('script_id')
  const lineOffset = locationFields.indexOf('line')
  const columnOffset = locationFields.indexOf('column')

  return {
    itemsPerLocation: locationFields.length,
    objectIndexOffset,
    scriptIdOffset,
    lineOffset,
    columnOffset,
  }
}

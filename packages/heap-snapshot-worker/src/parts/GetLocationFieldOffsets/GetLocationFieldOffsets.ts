export const getLocationFieldOffsets = (locationFields: readonly string[]) => {
  const objectIndexOffset = locationFields.indexOf('object_index')
  const scriptIdOffset = locationFields.indexOf('script_id')
  const lineOffset = locationFields.indexOf('line')
  const columnOffset = locationFields.indexOf('column')

  return {
    columnOffset,
    itemsPerLocation: locationFields.length,
    lineOffset,
    objectIndexOffset,
    scriptIdOffset,
  }
}

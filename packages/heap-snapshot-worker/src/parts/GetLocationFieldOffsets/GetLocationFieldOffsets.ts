export const getLocationFieldOffsets = (locationFields: readonly string[]) => {
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

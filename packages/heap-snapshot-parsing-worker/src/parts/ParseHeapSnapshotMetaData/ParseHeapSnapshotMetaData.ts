import { parseHeapSnapshotMetaDataIndices } from '../ParseHeapSnapshotMetaDataIndices/ParseHeapSnapshotMetaDataIndices.js'

export const EMPTY_DATA = {
  couldParse: false,
  data: {},
  endIndex: -1,
}

export const parseHeapSnapshotMetaData = (data) => {
  const { startIndex, endIndex } = parseHeapSnapshotMetaDataIndices(data)
  if (endIndex === -1) {
    return EMPTY_DATA
  }
  const content = data.slice(startIndex, endIndex)
  const parsed = JSON.parse(content) // TODO handle error?
  return {
    couldParse: true,
    data: parsed,
    endIndex,
  }
}

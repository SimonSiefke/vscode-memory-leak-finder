import { parseHeapSnapshotMetaDataIndices } from '../ParseHeapSnapshotMetaDataIndices/ParseHeapSnapshotMetaDataIndices.js'

export const parseHeapSnapshotArray = (data, metaData) => {
  const { startIndex, endIndex } = parseHeapSnapshotMetaDataIndices(data)
  if (endIndex === -1) {
    return {}
  }
  const content = data.slice(startIndex, endIndex)
  const parsed = JSON.parse(content) // TODO handle error?
  return {
    couldParse: true,
    data: parsed,
    endIndex,
  }
}

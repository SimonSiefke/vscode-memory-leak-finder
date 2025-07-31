import { getBalancedJsonIndices } from '../GetBalancedJsonIndices/GetBalancedJsonIndices.js'

export const EMPTY_DATA = {
  startIndex: -1,
  endIndex: -1,
}

export const parseHeapSnapshotMetaDataIndices = (data) => {
  const snapshotToken = '"snapshot":'
  const index = data.indexOf(snapshotToken)
  if (index === -1) {
    return EMPTY_DATA
  }
  const startIndex = index + snapshotToken.length
  const endIndex = getBalancedJsonIndices(data, startIndex)
  if (endIndex === -1) {
    return EMPTY_DATA
  }
  return {
    startIndex,
    endIndex,
  }
}

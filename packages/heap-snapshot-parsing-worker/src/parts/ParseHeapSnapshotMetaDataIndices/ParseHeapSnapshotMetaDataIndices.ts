import { getBalancedJsonIndices } from '../GetBalancedJsonIndices/GetBalancedJsonIndices.ts'

export const EMPTY_DATA = {
  endIndex: -1,
  startIndex: -1,
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
    endIndex,
    startIndex,
  }
}

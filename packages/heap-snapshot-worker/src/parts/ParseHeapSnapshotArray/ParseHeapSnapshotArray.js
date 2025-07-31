import { parseHeapSnapshotMetaDataIndices } from '../ParseHeapSnapshotMetaDataIndices/ParseHeapSnapshotMetaDataIndices.js'

const char0 = '0'.charCodeAt(0)
const char9 = '9'.charCodeAt(0)
const closingBracket = ']'.charCodeAt(0)

/**
 *
 * @param {string} data
 * @param {Uint32Array} array
 * @param {number} arrayIndex
 * @returns
 */
export const parseHeapSnapshotArray = (data, array, arrayIndex) => {
  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i)
    if (char0 <= code && code <= char9) {
      array[arrayIndex] = code - char0
      arrayIndex++
    }
  }
  for (const char of data) {
    const code = char.charCodeAt(0)
  }
  return {
    dataIndex: -1,
    arrayIndex: -1,
  }
}

import { parseHeapSnapshotMetaDataIndices } from '../ParseHeapSnapshotMetaDataIndices/ParseHeapSnapshotMetaDataIndices.js'

const char0 = '0'.charCodeAt(0)
const char9 = '9'.charCodeAt(0)
const comma = ','.charCodeAt(0)
const space = ' '.charCodeAt(0)

/**
 * Parses comma-separated numbers from a string into a Uint32Array
 * @param {string} data - The string containing comma-separated numbers
 * @param {Uint32Array} array - The array to store parsed numbers
 * @param {number} arrayIndex - The starting index in the array
 * @returns {{dataIndex: number, arrayIndex: number}} - The new data index and array index
 */
export const parseHeapSnapshotArray = (data, array, arrayIndex) => {
  let currentNumber = 0
  let hasDigits = false
  let dataIndex = 0

  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i)

    if (char0 <= code && code <= char9) {
      // Digit found
      currentNumber = currentNumber * 10 + (code - char0)
      hasDigits = true
    } else if (code === comma || code === space) {
      // Comma or space found - if we have digits, store the number
      if (hasDigits) {
        if (arrayIndex < array.length) {
          array[arrayIndex] = currentNumber
          arrayIndex++
        }
        currentNumber = 0
        hasDigits = false
      }
      // Skip spaces after comma
      if (code === comma) {
        while (i + 1 < data.length && data.charCodeAt(i + 1) === space) {
          i++
        }
      }
    } else {
      // Non-digit, non-comma character - stop parsing
      break
    }
    dataIndex = i + 1
  }

  // If we have digits at the end, store the number (it's complete)
  if (hasDigits) {
    if (arrayIndex < array.length) {
      array[arrayIndex] = currentNumber
      arrayIndex++
    }
    dataIndex = data.length
  }

  return {
    dataIndex,
    arrayIndex,
  }
}

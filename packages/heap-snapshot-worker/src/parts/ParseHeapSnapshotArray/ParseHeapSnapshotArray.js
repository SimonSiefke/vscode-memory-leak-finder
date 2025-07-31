import { parseHeapSnapshotMetaDataIndices } from '../ParseHeapSnapshotMetaDataIndices/ParseHeapSnapshotMetaDataIndices.js'

const char0 = '0'.charCodeAt(0)
const char9 = '9'.charCodeAt(0)
const comma = ','.charCodeAt(0)
const space = ' '.charCodeAt(0)
const closingBracket = ']'.charCodeAt(0)

/**
 * Parses comma-separated numbers from a string into a Uint32Array
 * @param {string} data - The string containing comma-separated numbers
 * @param {Uint32Array} array - The array to store parsed numbers
 * @param {number} arrayIndex - The starting index in the array
 * @returns {{dataIndex: number, arrayIndex: number, done: boolean}} - The new data index, array index, and completion status
 * @throws {RangeError} When array index is out of bounds
 */
export const parseHeapSnapshotArray = (data, array, arrayIndex) => {
  const dataLength = data.length
  const arrayLength = array.length
  let currentNumber = 0
  let hasDigits = false
  let dataIndex = 0
  let done = false

  for (let i = 0; i < dataLength; i++) {
    const code = data.charCodeAt(i)

    if (char0 <= code && code <= char9) {
      // Digit found
      currentNumber = currentNumber * 10 + (code - char0)
      hasDigits = true
    } else if (code === comma || code === space) {
      // Comma or space found - if we have digits, store the number
      if (hasDigits) {
        if (arrayIndex >= arrayLength) {
          throw new RangeError(`Array index ${arrayIndex} is out of bounds for array of length ${arrayLength}`)
        }
        array[arrayIndex] = currentNumber
        arrayIndex++
        currentNumber = 0
        hasDigits = false
      }
      // Skip spaces after comma
      if (code === comma) {
        while (i + 1 < dataLength && data.charCodeAt(i + 1) === space) {
          i++
        }
      }
    } else if (code === closingBracket) {
      // Closing bracket found - if we have digits, store the number and mark as done
      if (hasDigits) {
        if (arrayIndex >= arrayLength) {
          throw new RangeError(`Array index ${arrayIndex} is out of bounds for array of length ${arrayLength}`)
        }
        array[arrayIndex] = currentNumber
        arrayIndex++
      }
      done = true
      dataIndex = i + 1
      break
    } else {
      // Non-digit, non-comma, non-bracket character - stop parsing
      break
    }
    dataIndex = i + 1
  }

  // If we have digits at the end and no closing bracket, store the number (it's complete)
  if (hasDigits && !done) {
    if (arrayIndex >= arrayLength) {
      throw new RangeError(`Array index ${arrayIndex} is out of bounds for array of length ${arrayLength}`)
    }
    array[arrayIndex] = currentNumber
    arrayIndex++
    dataIndex = dataLength
  }

  return {
    dataIndex,
    arrayIndex,
    done,
  }
}

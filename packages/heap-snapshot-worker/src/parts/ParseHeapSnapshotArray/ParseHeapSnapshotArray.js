import { parseHeapSnapshotMetaDataIndices } from '../ParseHeapSnapshotMetaDataIndices/ParseHeapSnapshotMetaDataIndices.js'

const char0 = '0'.charCodeAt(0)
const char1 = '1'.charCodeAt(0)
const char2 = '2'.charCodeAt(0)
const char3 = '3'.charCodeAt(0)
const char4 = '4'.charCodeAt(0)
const char5 = '5'.charCodeAt(0)
const char6 = '6'.charCodeAt(0)
const char7 = '7'.charCodeAt(0)
const char8 = '8'.charCodeAt(0)
const char9 = '9'.charCodeAt(0)
const comma = ','.charCodeAt(0)
const space = ' '.charCodeAt(0)
const tab = '\t'.charCodeAt(0)
const newline = '\n'.charCodeAt(0)
const closingBracket = ']'.charCodeAt(0)

/**
 * Parses comma-separated numbers from a string into a Uint32Array
 * @param {string} data - The string containing comma-separated numbers
 * @param {Uint32Array} array - The array to store parsed numbers
 * @param {number} arrayIndex - The starting index in the array
 * @returns {{dataIndex: number, arrayIndex: number, done: boolean}} - The new data index, array index, and completion status
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

    switch (code) {
      case char0:
      case char1:
      case char2:
      case char3:
      case char4:
      case char5:
      case char6:
      case char7:
      case char8:
      case char9:
        currentNumber = currentNumber * 10 + (code - char0)
        hasDigits = true
        break

      case comma:
      case space:
      case tab:
      case newline:
        if (hasDigits) {
          if (arrayIndex >= arrayLength) {
            return { dataIndex: i, arrayIndex, done }
          }
          array[arrayIndex] = currentNumber
          arrayIndex++
          currentNumber = 0
          hasDigits = false
        }
        break

      case closingBracket:
        if (hasDigits) {
          if (arrayIndex >= arrayLength) {
            return { dataIndex: i, arrayIndex, done }
          }
          array[arrayIndex] = currentNumber
          arrayIndex++
        }
        done = true
        dataIndex = i + 1
        return { dataIndex, arrayIndex, done }

      default:
        // Non-digit, non-separator, non-bracket character - stop parsing
        dataIndex = i
        return { dataIndex, arrayIndex, done }
    }
  }

  // If we have digits at the end, don't store them - more data might come in next chunk
  dataIndex = dataLength
  return { dataIndex, arrayIndex, done }
}

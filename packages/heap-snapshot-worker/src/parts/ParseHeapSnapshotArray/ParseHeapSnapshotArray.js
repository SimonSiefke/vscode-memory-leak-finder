import { charTypes } from '../CreateCharTypesLookupTable/CreateCharTypesLookupTable.js'

const DIGIT = 1
const SEPARATOR = 2
const CLOSING_BRACKET = 3
const CHAR_0 = '0'.charCodeAt(0)

const getDigitCount = (number) => {
  if (number === 0) {
    return 1
  }
  return Math.floor(Math.log10(number)) + 1
}

/**
 * Parses comma-separated numbers from a Uint8Array buffer into a Uint32Array
 * @param {Uint8Array} data - The buffer containing comma-separated numbers
 * @param {Uint32Array} array - The array to store parsed numbers
 * @param {number} arrayIndex - The starting index in the array
 * @returns {{dataIndex: number, arrayIndex: number, done: boolean}} - The new data index, array index, and completion status
 * @throws {RangeError} When array index is out of bounds (except when reaching closing bracket)
 */
export const parseHeapSnapshotArray = (data, array, arrayIndex) => {
  const dataLength = data.length
  const arrayLength = array.length
  let currentNumber = 0
  let hasDigits = false
  let done = false

  for (let i = 0; i < dataLength; i++) {
    const code = data[i] // Direct array access instead of charCodeAt()
    const charType = charTypes[code]

    switch (charType) {
      case DIGIT:
        currentNumber = currentNumber * 10 + (code - CHAR_0)
        hasDigits = true
        break

      case SEPARATOR:
        if (hasDigits) {
          array[arrayIndex] = currentNumber
          arrayIndex++
          currentNumber = 0
          hasDigits = false
        }
        break

      case CLOSING_BRACKET:
        if (hasDigits) {
          array[arrayIndex] = currentNumber
          arrayIndex++
        }

        return {
          dataIndex: i + 1,
          arrayIndex,
          done: true,
        }

      default:
        console.log({ arrayIndex })
        throw new Error(`unexpected token ${code}`)
    }
  }

  // If we have digits at the end, backtrack to the beginning of the current number
  if (hasDigits) {
    const digitCount = getDigitCount(currentNumber)
    return {
      dataIndex: dataLength - digitCount,
      arrayIndex,
      done,
    }
  }

  return {
    dataIndex: dataLength,
    arrayIndex,
    done,
  }
}

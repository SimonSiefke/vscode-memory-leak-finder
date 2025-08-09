import { charTypes } from '../CreateCharTypesLookupTable/CreateCharTypesLookupTable.ts'
import { getDigitCount } from '../GetDigitCount/GetDigitCount.ts'

const DIGIT = 1
const SEPARATOR = 2
const CLOSING_BRACKET = 3
const MINUS = 4
const CHAR_0 = '0'.charCodeAt(0)

/**
 * Parses comma-separated numbers from a Uint8Array buffer into a number array
 * @param {Uint8Array} data - The buffer containing comma-separated numbers
 * @param {any} array - The array to store parsed numbers
 * @param {number} arrayIndex - The starting index in the array
 * @param {number} currentNumber - The current number being parsed (from previous chunk)
 * @param {boolean} hasDigits - Whether we have digits in the current number (from previous chunk)
 * @returns {{dataIndex: number, arrayIndex: number, done: boolean, currentNumber: number, hasDigits: boolean}} - The new data index, array index, completion status, and parsing state
 * @throws {RangeError} When array index is out of bounds
 */
export const parseHeapSnapshotArray = (data, array, arrayIndex, currentNumber = 0, hasDigits = false) => {
  const dataLength = data.length

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
          currentNumber: 0,
          hasDigits: false,
        }
      case MINUS:
        break
      default:
        throw new Error(`unexpected token ${code}`)
    }
  }

  // If we have digits at the end, we need to backtrack
  if (hasDigits) {
    // Normal case: backtrack within current chunk
    const digitCount = getDigitCount(currentNumber)
    return {
      dataIndex: dataLength - digitCount,
      arrayIndex,
      done: false,
      currentNumber,
      hasDigits,
    }
  }

  // If we reach here, we've processed all the data and there's no partial number
  // This means we've successfully parsed all complete numbers in this chunk
  return {
    dataIndex: dataLength,
    arrayIndex,
    done: false, // Not done because we haven't seen a closing bracket
    currentNumber: 0,
    hasDigits: false,
  }
}

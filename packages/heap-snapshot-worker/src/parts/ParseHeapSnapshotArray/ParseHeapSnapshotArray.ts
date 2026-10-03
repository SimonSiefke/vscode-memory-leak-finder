import { charTypes } from '../CreateCharTypesLookupTable/CreateCharTypesLookupTable.ts'

const DIGIT = 1
const SEPARATOR = 2
const CLOSING_BRACKET = 3
const MINUS = 4
const CHAR_0 = '0'.charCodeAt(0)

const getDigitCount = (value: number): number => {
  if (value === 0) {
    return 1
  }
  return Math.floor(Math.log10(Math.abs(value))) + 1
}

export interface ParseHeapSnapshotArrayResult {
  readonly arrayIndex: number
  readonly currentNumber: number
  readonly dataIndex: number
  readonly done: boolean
  readonly hasDigits: boolean
}

export const parseHeapSnapshotArray = (
  data: Uint8Array,
  array: Uint32Array,
  arrayIndex: number,
  currentNumber: number = 0,
  hasDigits: boolean = false,
): ParseHeapSnapshotArrayResult => {
  const dataLength = data.length

  for (let i = 0; i < dataLength; i++) {
    const code = data[i] // Direct array access instead of charCodeAt()
    const charType = charTypes[code]

    switch (charType) {
      case CLOSING_BRACKET:
        if (hasDigits) {
          array[arrayIndex] = currentNumber
          arrayIndex++
        }
        return {
          arrayIndex,
          currentNumber: 0,
          dataIndex: i + 1,
          done: true,
          hasDigits: false,
        }
      case DIGIT:
        currentNumber = currentNumber * 10 + (code - CHAR_0)
        hasDigits = true
        break
      case MINUS:
        break
      case SEPARATOR:
        if (hasDigits) {
          array[arrayIndex] = currentNumber
          arrayIndex++
          currentNumber = 0
          hasDigits = false
        }
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
      arrayIndex,
      currentNumber,
      dataIndex: dataLength - digitCount,
      done: false,
      hasDigits,
    }
  }

  // If we reach here, we've processed all the data and there's no partial number
  // This means we've successfully parsed all complete numbers in this chunk
  return {
    arrayIndex,
    currentNumber: 0,
    dataIndex: dataLength,
    done: false, // Not done because we haven't seen a closing bracket
    hasDigits: false,
  }
}

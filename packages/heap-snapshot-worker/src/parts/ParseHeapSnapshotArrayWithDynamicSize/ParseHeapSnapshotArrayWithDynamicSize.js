import { charTypes } from '../CreateCharTypesLookupTable/CreateCharTypesLookupTable.js'

const DIGIT = 1
const SEPARATOR = 2
const CLOSING_BRACKET = 3
const MINUS = 4
const CHAR_0 = '0'.charCodeAt(0)

const getDigitCount = (number) => {
  if (number === 0) {
    return 1
  }
  return Math.floor(Math.log10(Math.abs(number))) + 1
}

/**
 * Parses comma-separated numbers from a Uint8Array buffer into a resizable Uint32Array
 * @param {Uint8Array} data - The buffer containing comma-separated numbers
 * @param {Object} state - The parsing state object containing buffer and capacity info
 * @param {number} arrayIndex - The starting index in the array
 * @returns {{dataIndex: number, arrayIndex: number, done: boolean}} - The new data index, array index, and completion status
 */
export const parseHeapSnapshotArrayWithDynamicSize = (data, state, arrayIndex) => {
  const dataLength = data.length
  let currentNumber = 0
  let hasDigits = false
  let isNegative = false
  let done = false

  // Initialize resizable buffer if not already done
  if (state.array === null) {
    const initialCapacity = 1000
    state.buffer = new ArrayBuffer(initialCapacity * 4, { maxByteLength: 1024 * 1024 * 1024 }) // 1GB max
    state.array = new Uint32Array(state.buffer)
    state.capacity = initialCapacity
  }

  for (let i = 0; i < dataLength; i++) {
    const code = data[i] // Direct array access instead of charCodeAt()
    const charType = charTypes[code]

    switch (charType) {
      case DIGIT:
        currentNumber = currentNumber * 10 + (code - CHAR_0)
        hasDigits = true
        break

      case MINUS:
        if (!hasDigits && !isNegative) {
          isNegative = true
        } else {
          throw new Error('unexpected token')
        }
        break

      case SEPARATOR:
        if (hasDigits) {
          if (isNegative) {
            currentNumber = -currentNumber
          }

          // Check if we need to resize the buffer
          if (arrayIndex >= state.capacity) {
            const newCapacity = Math.min(state.capacity * 2, (1024 * 1024 * 1024) / 4) // Max 1GB worth of Uint32
            if (state.buffer) {
              state.buffer.resize(newCapacity * 4)
              // Create new view since the old one becomes detached
              const newArray = new Uint32Array(state.buffer)
              // Copy existing data
              newArray.set(state.array)
              state.array = newArray
              state.capacity = newCapacity
            }
          }

          state.array[arrayIndex] = currentNumber
          arrayIndex++
          currentNumber = 0
          hasDigits = false
          isNegative = false
        }
        break

      case CLOSING_BRACKET:
        if (hasDigits) {
          if (isNegative) {
            currentNumber = -currentNumber
          }

          // Check if we need to resize the buffer
          if (arrayIndex >= state.capacity) {
            const newCapacity = Math.min(state.capacity * 2, (1024 * 1024 * 1024) / 4)
            if (state.buffer) {
              state.buffer.resize(newCapacity * 4)
              const newArray = new Uint32Array(state.buffer)
              newArray.set(state.array)
              state.array = newArray
              state.capacity = newCapacity
            }
          }

          state.array[arrayIndex] = currentNumber
          arrayIndex++
        }

        // Resize to exact size
        if (state.buffer) {
          state.buffer.resize(arrayIndex * 4)
          state.array = new Uint32Array(state.buffer)
        }

        return {
          dataIndex: i + 1,
          arrayIndex,
          done: true,
        }

      default:
        throw new Error('unexpected token')
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

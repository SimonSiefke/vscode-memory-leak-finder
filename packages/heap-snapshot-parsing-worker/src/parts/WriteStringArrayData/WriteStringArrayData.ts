import { decodeArray } from '../DecodeArray/DecodeArray.ts'
import { concatArray } from '../ConcatArray/ConcatArray.ts'

/**
 * Parses string array data from heap snapshot chunks
 * Similar to parseHeapSnapshotArray, this function handles incomplete data
 * and returns how much data was consumed
 * @param {Uint8Array} chunk - The current chunk of data
 * @param {Uint8Array} data - Accumulated data buffer
 * @param {string[]} strings - Array to store parsed strings
 * @param {Function} onReset - Callback to reset parsing state
 * @param {Function} onDone - Callback when parsing is complete
 * @param {Function} onDataUpdate - Callback to update data buffer
 * @returns {boolean} Whether the chunk was successfully processed
 */
export const writeStringArrayData = (chunk, data, strings, onReset, onDone, onDataUpdate) => {
  // Concatenate the new chunk with existing data
  const combinedData = concatArray(data, chunk)

  // Parse strings from the combined data
  const result = parseStringArray(combinedData, strings)

  if (result.done) {
    // Parsing is complete
    onReset()
    onDone()
    const remainingData = combinedData.slice(result.dataIndex)
    onDataUpdate(remainingData)
    return true
  } else if (result.dataIndex > 0) {
    // Some data was parsed, update the buffer
    const remainingData = combinedData.slice(result.dataIndex)
    onDataUpdate(remainingData)
    return false // Not done yet, need more data
  } else {
    // No data could be parsed, need more data
    onDataUpdate(combinedData)
    return false
  }
}

/**
 * Parses a string array from a buffer
 * @param {Uint8Array} data - The data buffer to parse
 * @param {string[]} strings - Array to store parsed strings
 * @returns {{dataIndex: number, done: boolean}} How much data was consumed and whether parsing is complete
 */
const parseStringArray = (data, strings) => {
  let dataIndex = 0
  let state = 'outside' // 'outside', 'inside_string', 'after_backslash'
  let stringStart = -1
  let done = false

  const textDecoder = new TextDecoder()

  while (dataIndex < data.length) {
    const byte = data[dataIndex]
    const char = String.fromCharCode(byte)

    switch (state) {
      case 'outside':
        if (char === '"') {
          // Start of a string
          state = 'inside_string'
          stringStart = dataIndex + 1 // Skip the opening quote
          dataIndex++
        } else if (char === ']') {
          // End of array
          done = true
          dataIndex++
          break
        } else if (char === '}') {
          // End of JSON object (this can happen when parsing from JSON.stringify)
          // If we've parsed at least one string, consider it done
          if (strings.length > 0) {
            done = true
            dataIndex++
            break
          }
          // Otherwise, this might be incomplete data
          return { dataIndex, done: false }
        } else if (char === '[') {
          // Opening bracket, ignore it
          dataIndex++
        } else if (char === ',' || char === ' ' || char === '\n' || char === '\r' || char === '\t') {
          // Ignore whitespace and commas
          dataIndex++
        } else {
          // Unexpected character, might be incomplete data
          // Return the data we've processed so far
          return { dataIndex, done: false }
        }
        break

      case 'inside_string':
        if (char === '\\') {
          // Escape character, next character is literal
          state = 'after_backslash'
          dataIndex++
        } else if (char === '"') {
          // End of string
          const stringEnd = dataIndex
          if (stringStart <= stringEnd) {
            const stringBytes = data.slice(stringStart, stringEnd)
            const string = textDecoder.decode(stringBytes)
            // Process escaped characters in the string
            const processedString = string.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
            strings.push(processedString)
          }
          state = 'outside'
          dataIndex++
        } else {
          // Regular character inside string
          dataIndex++
        }
        break

      case 'after_backslash':
        // Skip the escaped character (it's already included in the string)
        dataIndex++
        state = 'inside_string'
        break
    }
  }

  // If we reach the end of data while inside a string, we need more data
  if (state === 'inside_string' || state === 'after_backslash') {
    // Return the data we've processed so far (up to the start of the incomplete string)
    return { dataIndex: stringStart - 1, done: false }
  }

  return { dataIndex, done }
}

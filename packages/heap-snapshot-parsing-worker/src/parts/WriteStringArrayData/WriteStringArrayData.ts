/**
 * Parses a string array from a buffer
 * @param {Uint8Array} data - The data buffer to parse
 * @param {string[]} strings - Array to store parsed strings
 * @returns {{dataIndex: number, done: boolean}} How much data was consumed and whether parsing is complete
 */
export const parseStringArray = (data: Uint8Array, strings: string[]) => {
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
            const processedString = string.replaceAll(String.raw`\"`, '"').replaceAll('\\\\', '\\')
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

/**
 * Writes string array data to the strings array using the parseStringArray function
 * @param {Uint8Array} chunk - The current chunk of data
 * @param {Uint8Array} data - Accumulated data from previous chunks
 * @param {string[]} strings - Array to store parsed strings
 * @param {Function} onReset - Callback to reset parsing state
 * @param {Function} onDone - Callback when parsing is complete
 * @param {Function} onDataUpdate - Callback to update accumulated data
 * @returns {boolean} Whether parsing is complete
 */
export const writeStringArrayData = (
  chunk: Uint8Array,
  data: Uint8Array,
  strings: string[],
  onReset: () => void,
  onDone: () => void,
  onDataUpdate: (newData: Uint8Array) => void,
) => {
  // Combine accumulated data with new chunk
  const combinedData = new Uint8Array(data.length + chunk.length)
  combinedData.set(data)
  combinedData.set(chunk, data.length)

  // Parse the combined data
  const { dataIndex, done } = parseStringArray(combinedData, strings)

  if (done) {
    // Parsing is complete
    onReset()
    onDone()
    onDataUpdate(new Uint8Array())
    return true
  }

  // More data needed, store the remaining data
  const remainingData = combinedData.slice(dataIndex)
  onDataUpdate(remainingData)
  return false
}

import { decodeArray } from '../DecodeArray/DecodeArray.js'
import { concatArray } from '../ConcatArray/ConcatArray.js'

/**
 * Parses string array data from heap snapshot chunks
 * @param {Uint8Array<ArrayBuffer>} chunk - The current chunk of data
 * @param {Uint8Array<ArrayBuffer>} data - Accumulated data buffer
 * @param {string[]} strings - Array to store parsed strings
 * @param {Function} onReset - Callback to reset parsing state
 * @param {Function} onDone - Callback when parsing is complete
 * @param {Function} onDataUpdate - Callback to update data buffer
 * @returns {boolean} Whether the chunk was successfully processed
 */
export const writeStringArrayData = (chunk, data, strings, onReset, onDone, onDataUpdate) => {
  // Concatenate the new chunk with existing data
  const combinedData = concatArray(data, chunk)
  const dataString = decodeArray(combinedData)

  // Look for the "strings": pattern first
  const stringsStartIndex = dataString.indexOf('"strings":')
  if (stringsStartIndex === -1) {
    // No strings section found, need more data
    onDataUpdate(combinedData)
    return false
  }

  // Find the opening bracket after "strings":
  const openingBracketIndex = dataString.indexOf('[', stringsStartIndex)
  if (openingBracketIndex === -1) {
    // No opening bracket found, need more data
    onDataUpdate(combinedData)
    return false
  }

  // Find the matching closing bracket
  let bracketCount = 0
  let closingBracketIndex = -1

  for (let i = openingBracketIndex; i < dataString.length; i++) {
    const char = dataString[i]
    if (char === '[') {
      bracketCount++
    } else if (char === ']') {
      bracketCount--
      if (bracketCount === 0) {
        closingBracketIndex = i
        break
      }
    }
  }

  if (closingBracketIndex === -1) {
    // No matching closing bracket found, need more data
    onDataUpdate(combinedData)
    return false
  }

  // Extract the strings array content
  const stringsContent = dataString.substring(openingBracketIndex, closingBracketIndex + 1)

  try {
    // Parse the strings array as JSON
    const parsedStrings = JSON.parse(stringsContent)

    if (Array.isArray(parsedStrings)) {
      // Add all strings to the strings array
      strings.push(...parsedStrings)

      // Reset parsing state
      onReset()

      // Mark as done
      onDone()

      // Return the remaining data after the strings array
      const remainingData = combinedData.slice(closingBracketIndex + 1)
      onDataUpdate(remainingData)

      return true
    } else {
      // If it's not an array, we might have incomplete data
      onDataUpdate(combinedData)
      return false
    }
  } catch (error) {
    // If JSON parsing fails, we might have incomplete data
    onDataUpdate(combinedData)
    return false
  }
}

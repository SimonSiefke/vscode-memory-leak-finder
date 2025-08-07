import { decodeArray } from '../DecodeArray/DecodeArray.ts'
import { concatArray } from '../ConcatArray/ConcatArray.ts'

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
  let openingBracketIndex = -1

  if (stringsStartIndex !== -1) {
    // Found "strings": pattern, find the opening bracket after it
    // We need to find the opening bracket that's immediately after "strings":
    // Skip any whitespace and find the first '[' after the colon
    const afterColon = dataString.substring(stringsStartIndex + 9) // length of '"strings":'
    const trimmedAfterColon = afterColon.trim()
    if (trimmedAfterColon.startsWith('[')) {
      // The opening bracket is right after the colon
      openingBracketIndex = stringsStartIndex + 9 + afterColon.indexOf('[')
    } else {
      // Look for the first '[' after the colon
      const bracketIndex = afterColon.indexOf('[')
      if (bracketIndex !== -1) {
        openingBracketIndex = stringsStartIndex + 9 + bracketIndex
      }
    }
  } else {
    // No "strings": pattern found, check if the data starts with an array or quoted string
    const trimmedData = dataString.trim()
    if (trimmedData.startsWith('[')) {
      openingBracketIndex = dataString.indexOf('[')
    } else if (trimmedData.startsWith('"')) {
      // Data starts with a quoted string, this is the array content
      // We need to find the end of the strings array by looking for the closing bracket
      // that matches the strings array (not any other array)
      let bracketCount = 0
      let closingBracketIndex = -1

      // Start from the beginning and count brackets
      for (let i = 0; i < dataString.length; i++) {
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

      if (closingBracketIndex !== -1) {
        // Wrap the content in brackets to make it a valid JSON array
        const stringsContent = '[' + dataString.substring(0, closingBracketIndex + 1)
        try {
          const parsedStrings = JSON.parse(stringsContent)
          if (Array.isArray(parsedStrings)) {
            strings.push(...parsedStrings)
            onReset()
            onDone()
            const remainingData = combinedData.slice(closingBracketIndex + 1)
            onDataUpdate(remainingData)
            return true
          }
        } catch (error) {
          onDataUpdate(combinedData)
          return false
        }
      } else {
        // No closing bracket found, but we have quoted strings
        // Try to parse as a comma-separated list of quoted strings
        try {
          // Find the last closing bracket in the data
          const lastClosingBracketIndex = dataString.lastIndexOf(']')
          if (lastClosingBracketIndex !== -1) {
            // Wrap everything up to the last closing bracket
            const stringsContent = '[' + dataString.substring(0, lastClosingBracketIndex + 1)
            const parsedStrings = JSON.parse(stringsContent)
            if (Array.isArray(parsedStrings)) {
              strings.push(...parsedStrings)
              onReset()
              onDone()
              const remainingData = combinedData.slice(lastClosingBracketIndex + 1)
              onDataUpdate(remainingData)
              return true
            }
          }
        } catch (error) {
          // If parsing fails, need more data
          onDataUpdate(combinedData)
          return false
        }
      }
      // If we can't find a closing bracket, need more data
      onDataUpdate(combinedData)
      return false
    }
  }

  if (openingBracketIndex === -1) {
    // No opening bracket found, need more data
    onDataUpdate(combinedData)
    return false
  }

  // Find the matching closing bracket for the strings array
  // Since we found the "strings": pattern, we need to find the closing bracket
  // that matches the opening bracket right after "strings":
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

/**
 * Finds a token in a Uint8Array buffer
 * @param {Uint8Array} buffer - The buffer to search in
 * @param {Uint8Array} tokenBytes - The token bytes to search for
 * @returns {number} - The index after the token, or -1 if not found
 */
export const findTokenInBuffer = (buffer, tokenBytes) => {
  const index = buffer.indexOf(tokenBytes)
  if (index === -1) {
    return -1
  }
  return index + tokenBytes.length
}

/**
 * Finds a character in a Uint8Array buffer starting from a given index
 * @param {Uint8Array} buffer - The buffer to search in
 * @param {number} startIndex - The index to start searching from
 * @param {number} charCode - The character code to search for
 * @returns {number} - The index of the character, or -1 if not found
 */
export const findCharInBuffer = (buffer, startIndex, charCode) => {
  for (let i = startIndex; i < buffer.length; i++) {
    if (buffer[i] === charCode) {
      return i
    }
  }
  return -1
}

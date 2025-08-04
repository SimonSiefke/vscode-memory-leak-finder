/**
 * Decodes a Uint8Array to a string using TextDecoder
 * @param {Uint8Array} data - The data to decode
 * @returns {string} The decoded string
 */
export const decodeArray = (data) => {
  return new TextDecoder().decode(data)
}

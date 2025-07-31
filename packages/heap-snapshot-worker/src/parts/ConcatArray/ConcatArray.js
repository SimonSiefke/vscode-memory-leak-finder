/**
 *
 * @param {Uint8Array} array
 * @param {Uint8Array} other
 * @returns {Uint8Array<ArrayBuffer>}
 */
export const concatArray = (array, other) => {
  // TODO check if concatenating many uint8 arrays could possibly negatively impact performance
  return new Uint8Array(Buffer.concat([array, other]))
}

/**
 *
 * @param {Uint32Array} array
 * @param {Uint32Array} other
 * @returns {Uint32Array<ArrayBuffer>}
 */
export const concatUint32Array = (array, other) => {
  const result = new Uint32Array(array.length + other.length)
  result.set(array)
  result.set(other, array.length)
  return result
}

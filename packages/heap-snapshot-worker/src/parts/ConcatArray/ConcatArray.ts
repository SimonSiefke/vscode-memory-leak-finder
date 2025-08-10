/**
 *
 * @param {Uint8Array} array
 * @param {Uint8Array} other
 * @returns {Uint8Array}
 */
export const concatArray = (array: Uint8Array, other: Uint8Array): Uint8Array => {
  if (array.length === 0) {
    return other
  }
  return new Uint8Array(Buffer.concat([array, other]))
}

/**
 *
 * @param {Uint32Array} array
 * @param {Uint32Array} other
 * @returns {Uint32Array}
 */
export const concatUint32Array = (array: Uint32Array, other: Uint32Array): Uint32Array => {
  const result = new Uint32Array(array.length + other.length)
  result.set(array)
  result.set(other, array.length)
  return result
}

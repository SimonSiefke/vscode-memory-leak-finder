/**
 *
 * @param {Uint8Array<ArrayBuffer>} array
 * @param {Uint8Array<ArrayBuffer>} other
 * @returns {Uint8Array<ArrayBuffer>}
 */
export const concatArray = (array: Uint8Array, other: Uint8Array): Uint8Array => {
  if (array.length === 0) {
    return other
  }
  return new Uint8Array(Buffer.concat([array, other]))
}

/**
 *
 * @param {Uint32Array<ArrayBuffer>} array
 * @param {Uint32Array<ArrayBuffer>} other
 * @returns {Uint32Array<ArrayBuffer>}
 */
export const concatUint32Array = (array: Uint32Array, other: Uint32Array): Uint32Array => {
  const result = new Uint32Array(array.length + other.length)
  result.set(array)
  result.set(other, array.length)
  return result
}

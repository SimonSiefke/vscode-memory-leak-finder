/**
 * @param {string} edgeTypeName
 * @param {string} edgeName
 * @returns {boolean}
 */
export const isInternalMap = (edgeTypeName, edgeName) => {
  return (
    edgeTypeName === 'property' &&
    edgeName !== 'constructor' &&
    edgeName !== '__proto__' &&
    edgeName !== 'prototype' &&
    !edgeName.startsWith('<symbol')
  )
}

/**
 * @param {string} edgeTypeName
 * @param {string} edgeName
 * @returns {boolean}
 */
export const isInternalMap = (edgeTypeName: string, edgeName: string) => {
  return (
    edgeTypeName === 'property' &&
    edgeName !== 'constructor' &&
    edgeName !== '__proto__' &&
    edgeName !== 'prototype' &&
    !edgeName.startsWith('<symbol')
  )
}

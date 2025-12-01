export const createHeapSnapshotNode = (
  array,
  startIndex,
  nodeFields,
  valueTypes,
  typeKey,
  nameKey,
  indexMultiplierKey,
  indexMultiplier,
  strings,
) => {
  const node = Object.create(null)
  const nodeFieldCount = nodeFields.length
  for (let j = 0; j < nodeFieldCount; j++) {
    const key = nodeFields[j]
    const value = array[startIndex + j]
    if (key === typeKey) {
      node[key] = valueTypes[value]
    } else if (key === nameKey) {
      node[key] = strings[value]
    } else if (key === indexMultiplierKey) {
      node[key] = value / indexMultiplier
    } else {
      node[key] = value
    }
  }
  return node
}

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
    switch (key) {
      case indexMultiplierKey: {
        node[key] = value / indexMultiplier

        break
      }
      case nameKey: {
        node[key] = strings[value]

        break
      }
      case typeKey: {
        node[key] = valueTypes[value]

        break
      }
      default: {
        node[key] = value
      }
    }
  }
  return node
}

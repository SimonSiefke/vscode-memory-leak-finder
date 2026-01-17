export const createHeapSnapshotNode = (
  array: any[],
  startIndex: number,
  nodeFields: any[],
  valueTypes: any[],
  typeKey: number,
  nameKey: number,
  indexMultiplierKey: number,
  indexMultiplier: number,
  strings: any[],
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

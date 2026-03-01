type HeapSnapshotNode = {
  readonly [key: string]: number | string | undefined
}

export const createHeapSnapshotNode = (
  array: readonly number[] | Uint32Array,
  startIndex: number,
  nodeFields: readonly string[],
  valueTypes: readonly string[],
  typeKey: string | number,
  nameKey: string | number,
  indexMultiplierKey: string | number,
  indexMultiplier: number,
  strings: readonly string[],
): HeapSnapshotNode => {
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

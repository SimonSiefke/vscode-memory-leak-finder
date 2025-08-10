export interface HeapSnapshotNode {
  id: number
  type: string
  name: string
  edgeCount: number
  [key: string]: any
}

export const createHeapSnapshotNode = (
  array: any[],
  startIndex: number,
  nodeFields: string[],
  valueTypes: string[],
  typeKey: string,
  nameKey: string,
  indexMultiplierKey: string,
  indexMultiplier: number,
  strings: string[],
): HeapSnapshotNode => {
  const node: HeapSnapshotNode = Object.create(null)
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

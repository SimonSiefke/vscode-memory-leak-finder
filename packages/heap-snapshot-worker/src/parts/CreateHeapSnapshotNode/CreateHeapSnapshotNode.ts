import type { HeapSnapshotRecord, HeapSnapshotValue } from '../Snapshot/Snapshot.ts'

export const createHeapSnapshotNode = (
  array: readonly number[],
  startIndex: number,
  nodeFields: readonly string[],
  valueTypes: readonly string[],
  typeKey: string,
  nameKey: string,
  indexMultiplierKey: string,
  indexMultiplier: number,
  strings: readonly string[],
): HeapSnapshotRecord => {
  const node: Record<string, HeapSnapshotValue> = Object.create(null)
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

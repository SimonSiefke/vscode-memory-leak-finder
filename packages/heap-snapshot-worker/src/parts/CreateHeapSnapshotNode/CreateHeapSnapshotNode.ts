import type { HeapSnapshotRecord, HeapSnapshotValue, NumberArray } from '../Snapshot/Snapshot.ts'

export const createHeapSnapshotNode = (
  array: NumberArray,
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
        const type = nameKey === 'nameOrIndex' ? valueTypes[array[startIndex + nodeFields.indexOf(typeKey)]] : undefined
        // V8 stores numeric indices for element and hidden edges, not string-table offsets.
        node[key] = type === 'element' || type === 'hidden' ? value : strings[value]

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

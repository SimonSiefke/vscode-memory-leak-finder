import * as Assert from '../Assert/Assert.js'
import * as CamelCase from '../CamelCase/CamelCase.js'
import * as CreateHeapSnapshotNode from '../CreateHeapSnapshotNode/CreateHeapSnapshotNode.js'
import type { HeapSnapshotNode } from '../CreateHeapSnapshotNode/CreateHeapSnapshotNode.js'

export const parseHeapSnapshotObjects = (
  values: Uint32Array,
  valueFields: string[],
  valueTypes: string[][],
  typeKey: string,
  nameKey: string,
  indexMultiplierKey: string,
  indexMultiplier: number,
  strings: string[],
): HeapSnapshotNode[] => {
  // Assert.array(values)
  Assert.array(valueFields)
  Assert.array(valueTypes)
  const parsed: HeapSnapshotNode[] = []
  const nodeFieldCount = valueFields.length
  const camelCaseNodeFields = valueFields.map(CamelCase.camelCase)
  for (let i = 0; i < values.length; i += nodeFieldCount) {
    const node = CreateHeapSnapshotNode.createHeapSnapshotNode(
      values as any,
      i,
      camelCaseNodeFields,
      valueTypes,
      typeKey,
      nameKey,
      indexMultiplierKey,
      indexMultiplier,
      strings,
    )
    parsed.push(node)
  }
  return parsed
}

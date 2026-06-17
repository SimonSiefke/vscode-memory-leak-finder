import * as Assert from '../Assert/Assert.ts'
import * as CamelCase from '../CamelCase/CamelCase.ts'
import * as CreateHeapSnapshotNode from '../CreateHeapSnapshotNode/CreateHeapSnapshotNode.ts'

type HeapSnapshotNode = {
  readonly [key: string]: number | string | undefined
}

export const parseHeapSnapshotObjects = (
  values: readonly number[],
  valueFields: readonly string[],
  valueTypes: readonly string[],
  typeKey: string,
  nameKey: string,
  indexMultiplierKey: string,
  indexMultiplier: number,
  strings: readonly string[],
): readonly HeapSnapshotNode[] => {
  // Assert.array(values)
  Assert.array(valueFields)
  Assert.array(valueTypes)
  const parsed: HeapSnapshotNode[] = []
  const nodeFieldCount = valueFields.length
  const camelCaseNodeFields = valueFields.map(CamelCase.camelCase)
  for (let i = 0; i < values.length; i += nodeFieldCount) {
    const node = CreateHeapSnapshotNode.createHeapSnapshotNode(
      values as number[],
      i,
      camelCaseNodeFields as string[],
      valueTypes as string[],
      typeKey,
      nameKey,
      indexMultiplierKey,
      indexMultiplier,
      strings as string[],
    )
    parsed.push(node as HeapSnapshotNode)
  }
  return parsed
}

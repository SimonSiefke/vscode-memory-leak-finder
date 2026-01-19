import * as Assert from '../Assert/Assert.ts'
import * as CamelCase from '../CamelCase/CamelCase.ts'
import * as CreateHeapSnapshotNode from '../CreateHeapSnapshotNode/CreateHeapSnapshotNode.ts'

export const parseHeapSnapshotObjects = (
  values: readonly number[],
  valueFields: readonly string[],
  valueTypes: readonly string[],
  typeKey: string,
  nameKey: string,
  indexMultiplierKey: string,
  indexMultiplier: number,
  strings: readonly string[],
) => {
  // Assert.array(values)
  Assert.array(valueFields)
  Assert.array(valueTypes)
  const parsed: readonly any[] = [] as unknown as any[]
  const nodeFieldCount = valueFields.length
  const camelCaseNodeFields = valueFields.map(CamelCase.camelCase)
  for (let i = 0; i < values.length; i += nodeFieldCount) {
    const node = CreateHeapSnapshotNode.createHeapSnapshotNode(
      values,
      i,
      camelCaseNodeFields,
      valueTypes,
      typeKey,
      nameKey,
      indexMultiplierKey,
      indexMultiplier,
      strings,
    )
    ;(parsed as any[]).push(node)
  }
  return parsed
}

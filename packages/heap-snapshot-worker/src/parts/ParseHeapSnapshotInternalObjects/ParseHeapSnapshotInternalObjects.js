import * as Assert from '../Assert/Assert.js'
import * as CamelCase from '../CamelCase/CamelCase.js'
import * as CreateHeapSnapshotNode from '../CreateHeapSnapshotNode/CreateHeapSnapshotNode.js'

export const parseHeapSnapshotObjects = (
  values,
  valueFields,
  valueTypes,
  typeKey,
  nameKey,
  indexMultiplierKey,
  indexMultiplier,
  strings,
) => {
  Assert.array(values)
  Assert.array(valueFields)
  Assert.array(valueTypes)
  const parsed = []
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
    parsed.push(node)
  }
  return parsed
}

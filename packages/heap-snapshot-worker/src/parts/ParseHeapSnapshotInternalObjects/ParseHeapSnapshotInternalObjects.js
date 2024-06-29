import * as Assert from '../Assert/Assert.js'
import * as CamelCase from '../CamelCase/CamelCase.js'

const createNode = (array, startIndex, nodeFields, valueTypes, typeKey, nameKey, indexMultiplierKey, indexMultiplier, strings) => {
  const node = Object.create(null)
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
    const node = createNode(values, i, camelCaseNodeFields, valueTypes, typeKey, nameKey, indexMultiplierKey, indexMultiplier, strings)
    parsed.push(node)
  }
  return parsed
}

import * as Assert from '../Assert/Assert.js'
import * as CamelCase from '../CamelCase/CamelCase.js'

const createNode = (array, startIndex, nodeFields, valueTypes, typeKey, nameKey, strings) => {
  const node = Object.create(null)
  const nodeFieldCount = nodeFields.length
  for (let j = 0; j < nodeFieldCount; j++) {
    const key = nodeFields[j]
    const value = array[startIndex + j]
    if (key === typeKey) {
      node[key] = valueTypes[value]
    } else if (key === nameKey) {
      node[key] = strings[value]
    } else {
      node[key] = value
    }
  }
  return node
}

export const parseHeapSnapshotObjects = (values, valueFields, valueTypes, typeKey, nameKey, strings) => {
  Assert.array(values)
  Assert.array(valueFields)
  Assert.array(valueTypes)
  const parsed = []
  const nodeFieldCount = valueFields.length
  const camelCaseNodeFields = valueFields.map(CamelCase.camelCase)
  for (let i = 0; i < values.length; i += nodeFieldCount) {
    const node = createNode(values, i, camelCaseNodeFields, valueTypes, typeKey, nameKey, strings)
    parsed.push(node)
  }
  return parsed
}

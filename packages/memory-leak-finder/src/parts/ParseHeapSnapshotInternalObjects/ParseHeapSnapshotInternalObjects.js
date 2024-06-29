import * as Assert from '../Assert/Assert.js'
import * as CamelCase from '../CamelCase/CamelCase.js'

const createNode = (array, startIndex, nodeFields, valueTypes) => {
  const node = Object.create(null)
  const nodeFieldCount = nodeFields.length
  for (let j = 0; j < nodeFieldCount; j++) {
    const key = nodeFields[j]
    const value = array[startIndex + j]
    if (key === 'type') {
      node[key] = valueTypes[value]
    } else {
      node[key] = value
    }
  }
  return node
}

export const parseHeapSnapshotObjects = (values, valueFields, valueTypes) => {
  Assert.array(values)
  Assert.array(valueFields)
  Assert.array(valueTypes)
  const parsed = []
  const nodeFieldCount = valueFields.length
  const camelCaseNodeFields = valueFields.map(CamelCase.camelCase)
  for (let i = 0; i < values.length; i += nodeFieldCount) {
    const node = createNode(values, i, camelCaseNodeFields, valueTypes)
    parsed.push(node)
  }
  return parsed
}

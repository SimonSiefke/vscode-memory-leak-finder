import * as Assert from '../Assert/Assert.js'
import * as CamelCase from '../CamelCase/CamelCase.js'

const createNode = (array, startIndex, nodeFields) => {
  const node = Object.create(null)
  const nodeFieldCount = nodeFields.length
  for (let j = 0; j < nodeFieldCount; j++) {
    const key = nodeFields[j]
    const value = array[startIndex + j]
    node[key] = value
  }
  return node
}

export const parseHeapSnapshotInternalNodes = (nodes, nodeFields, nodeTypes) => {
  Assert.array(nodes)
  Assert.array(nodeFields)
  Assert.array(nodeTypes)
  const parsed = []
  const nodeFieldCount = nodeFields.length
  const camelCaseNodeFields = nodeFields.map(CamelCase.camelCase)
  for (let i = 0; i < nodes.length; i += nodeFieldCount) {
    const node = createNode(nodes, i, camelCaseNodeFields)
    parsed.push(node)
  }
  return parsed
}

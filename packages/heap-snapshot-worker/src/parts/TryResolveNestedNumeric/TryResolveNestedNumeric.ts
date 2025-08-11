import { getActualValue } from '../GetActualValue/GetActualValue.ts'
import { getNodeEdges } from '../GetNodeEdges/GetNodeEdges.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const tryResolveNestedNumeric = (
  containerNodeIndex: number,
  snapshot: Snapshot,
  edgeMap: Uint32Array,
  propertyName: string,
  visited: Set<number>,
): number | null => {
  const { nodes, edges, strings, meta } = snapshot
  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields
  const nodeTypes = meta.node_types
  const ITEMS_PER_NODE = nodeFields.length

  const propertyNameIndex = strings.findIndex((s) => s === propertyName)
  if (propertyNameIndex === -1) {
    return null
  }

  const nodeEdges = getNodeEdges(containerNodeIndex, edgeMap, nodes, edges, nodeFields, edgeFields)
  const ITEMS_PER_EDGE = edgeFields.length
  const edgeNameFieldIndex = edgeFields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edgeFields.indexOf('to_node')
  for (let i = 0; i < nodeEdges.length; i += ITEMS_PER_EDGE) {
    const nameIndex = nodeEdges[i + edgeNameFieldIndex]
    if (nameIndex === propertyNameIndex) {
      const toNode = nodeEdges[i + edgeToNodeFieldIndex]
      const targetIndex = Math.floor(toNode / ITEMS_PER_NODE)
      const nestedNode = parseNode(targetIndex, nodes, nodeFields)
      if (!nestedNode) {
        continue
      }
      const nestedType = getNodeTypeName(nestedNode, nodeTypes) || 'unknown'
      if (nestedType === 'number' || nestedType === 'string' || nestedType === 'code' || nestedType === 'hidden') {
        const actual = getActualValue(nestedNode, snapshot, edgeMap, visited)
        const parsed = Number(actual)
        if (Number.isFinite(parsed)) {
          return parsed
        }
      }
    }
  }
  return null
}

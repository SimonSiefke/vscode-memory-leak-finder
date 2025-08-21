import { getActualValueFast } from '../GetActualValueFast/GetActualValueFast.ts'
import { getNodeEdgesFast } from '../GetNodeEdgesFast/GetNodeEdgesFast.ts'
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
  const ITEMS_PER_EDGE = edgeFields.length

  const propertyNameIndex = strings.findIndex((s) => s === propertyName)
  if (propertyNameIndex === -1) {
    return null
  }

  const edgeCountFieldIndex = nodeFields.indexOf('edge_count')
  const nodeEdges = getNodeEdgesFast(containerNodeIndex, edgeMap, nodes, edges, ITEMS_PER_NODE, ITEMS_PER_EDGE, edgeCountFieldIndex)
  const edgeTypeFieldIndex = edgeFields.indexOf('type')
  const edgeNameFieldIndex = edgeFields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edgeFields.indexOf('to_node')
  const idFieldIndex = nodeFields.indexOf('id')
  const nodeTypeNames = nodeTypes[0] || []
  const NODE_TYPE_STRING = nodeTypeNames.indexOf('string')
  const NODE_TYPE_NUMBER = nodeTypeNames.indexOf('number')
  const NODE_TYPE_OBJECT = nodeTypeNames.indexOf('object')
  const NODE_TYPE_ARRAY = nodeTypeNames.indexOf('array')
  const EDGE_TYPE_INTERNAL = (meta.edge_types[0] || []).indexOf('internal')
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
        const actual = getActualValueFast(
          nestedNode,
          snapshot,
          edgeMap,
          visited,
          targetIndex,
          nodeFields,
          nodeTypes,
          edgeFields,
          strings,
          ITEMS_PER_NODE,
          ITEMS_PER_EDGE,
          idFieldIndex,
          edgeCountFieldIndex,
          edgeTypeFieldIndex,
          edgeNameFieldIndex,
          edgeToNodeFieldIndex,
          EDGE_TYPE_INTERNAL,
          NODE_TYPE_STRING,
          NODE_TYPE_NUMBER,
          NODE_TYPE_OBJECT,
          NODE_TYPE_ARRAY,
        )
        const parsed = Number(actual)
        if (Number.isFinite(parsed)) {
          return parsed
        }
      }
    }
  }
  return null
}

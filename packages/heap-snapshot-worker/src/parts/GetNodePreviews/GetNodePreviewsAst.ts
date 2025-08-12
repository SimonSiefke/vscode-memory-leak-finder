import type { ArrayNode, AstNode, ObjectNode, PropertyEntry } from '../AstNode/AstNode.ts'
import { getNodeEdgesFast } from '../GetNodeEdgesFast/GetNodeEdgesFast.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

const createUnknown = (id: number, name: string | null, value?: string): AstNode => ({
  type: 'unknown',
  id,
  name,
  value,
})

export const buildAstForNode = (
  nodeIndex: number,
  snapshot: Snapshot,
  edgeMap: Uint32Array,
  nodeFields: readonly string[],
  nodeTypes: readonly (readonly string[])[],
  edgeFields: readonly string[],
  strings: readonly string[],
  ITEMS_PER_NODE: number,
  ITEMS_PER_EDGE: number,
  edgeCountFieldIndex: number,
  edgeTypeFieldIndex: number,
  edgeNameFieldIndex: number,
  edgeToNodeFieldIndex: number,
  EDGE_TYPE_PROPERTY: number,
  EDGE_TYPE_INTERNAL: number,
  depth: number,
  visited: Set<number>,
): AstNode | null => {
  const { nodes, edges } = snapshot
  const node = parseNode(nodeIndex, nodes, nodeFields)
  if (!node) return null
  const nodeTypeName = getNodeTypeName(node, nodeTypes) || 'unknown'
  const name = getNodeName(node, strings)
  const id = node.id

  if (visited.has(id)) {
    return createUnknown(id, name, `[Circular ${id}]`)
  }
  visited.add(id)

  if (nodeTypeName === 'string') {
    return { type: 'string', id, name, value: name ?? '' }
  }
  if (nodeTypeName === 'number') {
    const n = typeof node.name === 'number' ? strings[node.name] : undefined
    const parsed = n !== undefined ? Number(n) : NaN
    return { type: 'number', id, name, value: Number.isFinite(parsed) ? parsed : (n ?? '') }
  }
  if (nodeTypeName === 'bigint') {
    const v = name ?? ''
    return { type: 'bigint', id, name, value: v }
  }
  if (nodeTypeName === 'object' || nodeTypeName === 'array') {
    const nodeEdges = getNodeEdgesFast(nodeIndex, edgeMap, nodes, edges, ITEMS_PER_NODE, ITEMS_PER_EDGE, edgeCountFieldIndex)
    if (nodeTypeName === 'array') {
      const elements: AstNode[] = []
      if (depth <= 0) {
        const arr: ArrayNode = { type: 'array', id, name, elements }
        return arr
      }
      for (let i = 0; i < nodeEdges.length; i += ITEMS_PER_EDGE) {
        const toNode = nodeEdges[i + edgeToNodeFieldIndex]
        const childIndex = Math.floor(toNode / ITEMS_PER_NODE)
        const childAst = buildAstForNode(
          childIndex,
          snapshot,
          edgeMap,
          nodeFields,
          nodeTypes,
          edgeFields,
          strings,
          ITEMS_PER_NODE,
          ITEMS_PER_EDGE,
          edgeCountFieldIndex,
          edgeTypeFieldIndex,
          edgeNameFieldIndex,
          edgeToNodeFieldIndex,
          EDGE_TYPE_PROPERTY,
          EDGE_TYPE_INTERNAL,
          depth - 1,
          visited,
        )
        if (childAst) elements.push(childAst)
      }
      const arr: ArrayNode = { type: 'array', id, name, elements }
      return arr
    }

    // object
    const properties: PropertyEntry[] = []
    if (depth <= 0) {
      const obj: ObjectNode = { type: 'object', id, name, properties }
      return obj
    }
    for (let i = 0; i < nodeEdges.length; i += ITEMS_PER_EDGE) {
      const edgeType = nodeEdges[i + edgeTypeFieldIndex]
      if (edgeType !== EDGE_TYPE_PROPERTY) continue
      const propNameIndex = nodeEdges[i + edgeNameFieldIndex]
      const propName = strings[propNameIndex]
      if (!propName) continue
      const toNode = nodeEdges[i + edgeToNodeFieldIndex]
      const childIndex = Math.floor(toNode / ITEMS_PER_NODE)
      const valueAst = buildAstForNode(
        childIndex,
        snapshot,
        edgeMap,
        nodeFields,
        nodeTypes,
        edgeFields,
        strings,
        ITEMS_PER_NODE,
        ITEMS_PER_EDGE,
        edgeCountFieldIndex,
        edgeTypeFieldIndex,
        edgeNameFieldIndex,
        edgeToNodeFieldIndex,
        EDGE_TYPE_PROPERTY,
        EDGE_TYPE_INTERNAL,
        depth - 1,
        visited,
      )
      if (!valueAst) continue
      properties.push({ id, name: propName, value: valueAst })
    }
    const obj: ObjectNode = { type: 'object', id, name, properties }
    return obj
  }

  if (nodeTypeName === 'code' || nodeTypeName === 'closure') {
    return { type: nodeTypeName as any, id, name }
  }

  return createUnknown(id, name, `[${nodeTypeName} ${id}]`)
}

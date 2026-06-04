import type { ArrayNode, AstNode, CodeNode, ObjectNode, PropertyEntry, UnknownNode } from '../AstNode/AstNode.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { getBooleanValue } from '../GetBooleanValue/GetBooleanValue.ts'
import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.ts'
import { getNodeEdgesFast } from '../GetNodeEdgesFast/GetNodeEdgesFast.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'

const createUnknown = (id: number, name: string | null, value?: string): AstNode => ({
  id,
  name,
  type: 'unknown',
  value: undefined,
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
  const { edges, nodes } = snapshot
  const node = parseNode(nodeIndex, nodes, nodeFields)
  if (!node) return null
  const nodeTypeName = getNodeTypeName(node, nodeTypes) || 'unknown'
  const name = getNodeName(node, strings)
  const id = node.id as number

  if (visited.has(id)) {
    return createUnknown(id, name, `[Circular ${id}]`)
  }
  visited.add(id)

  if (nodeTypeName === 'string') {
    return { id, name, type: 'string', value: name ?? '' }
  }
  if (nodeTypeName === 'number') {
    const n = typeof node.name === 'number' ? strings[node.name] : undefined
    const parsed = n === undefined ? Number.NaN : Number(n)
    return { id, name, type: 'number', value: Number.isFinite(parsed) ? parsed : (n ?? '') }
  }
  if (nodeTypeName === 'bigint') {
    const v = name ?? ''
    return { id, name, type: 'bigint', value: v }
  }
  if (nodeTypeName === 'hidden') {
    // Try boolean detection; otherwise unknown/hidden
    const value = getBooleanValue(node, snapshot, edgeMap)
    if (value === 'true') {
      return { id, name, type: 'boolean', value: true } as any
    }
    if (value === 'false') {
      return { id, name, type: 'boolean', value: false } as any
    }
    return createUnknown(id, name, `[hidden ${id}]`)
  }
  if (nodeTypeName === 'object' || nodeTypeName === 'array') {
    const nodeEdges = getNodeEdgesFast(nodeIndex, edgeMap, nodes, edges, ITEMS_PER_NODE, ITEMS_PER_EDGE, edgeCountFieldIndex)
    if (nodeTypeName === 'array') {
      const elements: AstNode[] = []
      if (depth <= 0) {
        const arr: ArrayNode = { elements, id, name, type: 'array' }
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
      const arr: ArrayNode = { elements, id, name, type: 'array' }
      return arr
    }

    // object
    const properties: PropertyEntry[] = []
    if (depth <= 0) {
      const obj: ObjectNode = { id, name, properties, type: 'object' }
      return obj
    }
    for (let i = 0; i < nodeEdges.length; i += ITEMS_PER_EDGE) {
      const edgeType = nodeEdges[i + edgeTypeFieldIndex]
      if (edgeType !== EDGE_TYPE_PROPERTY) continue
      const propNameIndex = nodeEdges[i + edgeNameFieldIndex]
      const propName = strings[propNameIndex]
      if (!propName) continue
      if (propName === '__proto__') continue
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
    const obj: ObjectNode = { id, name, properties, type: 'object' }
    return obj
  }

  if (nodeTypeName === 'code' || nodeTypeName === 'closure') {
    // Include scriptId, line, column on the AST node itself
    let scriptIdValue: number | undefined
    let lineValue: number | undefined
    let columnValue: number | undefined
    const locationFields = snapshot.meta.location_fields
    const { locations } = snapshot
    if (locationFields && locationFields.length > 0 && locations && locations.length > 0) {
      const { columnOffset, itemsPerLocation, lineOffset, objectIndexOffset, scriptIdOffset } = getLocationFieldOffsets(locationFields)
      const objectIndexViaTrace = typeof node.trace_node_id === 'number' && node.trace_node_id !== 0 ? node.trace_node_id : -1
      const objectIndexViaNode = nodeIndex
      for (let locIndex = 0; locIndex < locations.length; locIndex += itemsPerLocation) {
        const objectIndex = locations[locIndex + objectIndexOffset] / ITEMS_PER_NODE
        if (objectIndex === objectIndexViaTrace || objectIndex === objectIndexViaNode) {
          scriptIdValue = locations[locIndex + scriptIdOffset]
          lineValue = locations[locIndex + lineOffset]
          columnValue = locations[locIndex + columnOffset]
          break
        }
      }
    }
    if (nodeTypeName === 'code') {
      const codeNode: CodeNode = {
        id,
        name,
        type: 'code',
        ...(columnValue !== undefined && { column: columnValue }),
        ...(lineValue !== undefined && { line: lineValue }),
        ...(scriptIdValue !== undefined && { scriptId: scriptIdValue }),
      }
      return codeNode
    }
    const closureNode: CodeNode = {
      id,
      name,
      type: 'closure',
      ...(columnValue !== undefined && { column: columnValue }),
      ...(lineValue !== undefined && { line: lineValue }),
      ...(scriptIdValue !== undefined && { scriptId: scriptIdValue }),
    }
    return closureNode
  }

  return createUnknown(id, name, `[${nodeTypeName} ${id}]`)
}

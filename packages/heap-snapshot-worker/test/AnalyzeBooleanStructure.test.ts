import { test, expect } from '@jest/globals'
import { parseNode } from '../src/parts/ParseNode/ParseNode.ts'
import { createEdgeMap } from '../src/parts/CreateEdgeMap/CreateEdgeMap.ts'
import { getNodeEdgesFast } from '../src/parts/GetNodeEdgesFast/GetNodeEdgesFast.ts'
import { getNodeName } from '../src/parts/GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../src/parts/GetNodeTypeName/GetNodeTypeName.ts'
import { getBooleanValue } from '../src/parts/GetBooleanValue/GetBooleanValue.ts'

/**
 * Analyzes how a boolean property is represented with type + value references
 */
const analyzeBooleanStructure = (snapshot: any, sourceNodeId: number, propertyName: string): any => {
  const { nodes, edges, strings, meta } = snapshot
  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields
  const ITEMS_PER_NODE = nodeFields.length
  const idFieldIndex = nodeFields.indexOf('id')

  // Find the source node
  let sourceNodeIndex = -1
  for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
    if (nodes[i + idFieldIndex] === sourceNodeId) {
      sourceNodeIndex = i / ITEMS_PER_NODE
      break
    }
  }

  if (sourceNodeIndex === -1) {
    return { error: `Source node ${sourceNodeId} not found` }
  }

  const edgeMap = createEdgeMap(nodes, nodeFields)
  const ITEMS_PER_NODE = nodeFields.length
  const ITEMS_PER_EDGE = edgeFields.length
  const edgeCountFieldIndex = nodeFields.indexOf('edge_count')
  const nodeEdges = getNodeEdgesFast(sourceNodeIndex, edgeMap, nodes, edges, ITEMS_PER_NODE, ITEMS_PER_EDGE, edgeCountFieldIndex)

  // Find all edges related to the property (both direct property and internal edges)
  const propertyNameIndex = strings.findIndex((str) => str === propertyName)
  const relatedEdges: any[] = []

  // Get edge type names
  const edgeTypes = meta.edge_types[0] || []
  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')
  const EDGE_TYPE_INTERNAL = edgeTypes.indexOf('internal')

  const ITEMS_PER_EDGE = edgeFields.length
  const edgeTypeFieldIndex = edgeFields.indexOf('type')
  const edgeNameFieldIndex = edgeFields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edgeFields.indexOf('to_node')

  for (let i = 0; i < nodeEdges.length; i += ITEMS_PER_EDGE) {
    const type = nodeEdges[i + edgeTypeFieldIndex]
    const nameIndex = nodeEdges[i + edgeNameFieldIndex]
    const toNode = nodeEdges[i + edgeToNodeFieldIndex]
    const edgeTypeName = edgeTypes[type] || `type_${type}`
    const targetNodeIndex = Math.floor(toNode / ITEMS_PER_NODE)
    const targetNode = parseNode(targetNodeIndex, nodes, nodeFields)

    if (!targetNode) continue

    let edgeName = ''
    if (edgeTypeName === 'element') {
      edgeName = `[${nameIndex}]`
    } else {
      edgeName = strings[nameIndex] || `<string_${nameIndex}>`
    }

    const isDirectProperty = type === EDGE_TYPE_PROPERTY && nameIndex === propertyNameIndex
    const isInternalEdge = type === EDGE_TYPE_INTERNAL

    if (isDirectProperty || isInternalEdge) {
      const targetTypeName = getNodeTypeName(targetNode, meta.node_types)
      const targetName = getNodeName(targetNode, strings)
      const booleanValue = getBooleanValue(targetNode, snapshot, edgeMap)

      relatedEdges.push({
        edgeType: edgeTypeName,
        edgeName: edgeName,
        isDirectProperty: isDirectProperty,
        isInternal: isInternalEdge,
        targetNodeId: targetNode.id,
        targetNodeType: targetTypeName,
        targetNodeName: targetName,
        targetBooleanValue: booleanValue,
        targetEdgeCount: targetNode.edge_count,
        nameIndex: nameIndex,
        toNode: toNode,
      })
    }
  }

  return {
    sourceNodeId: sourceNodeId,
    propertyName: propertyName,
    relatedEdges: relatedEdges,
    analysis: analyzeEdgePatterns(relatedEdges),
  }
}

/**
 * Analyzes the patterns in edges to determine which might be type vs value
 */
const analyzeEdgePatterns = (edges: any[]): any => {
  const propertyEdges = edges.filter((e) => e.isDirectProperty)
  const internalEdges = edges.filter((e) => e.isInternal)

  // Look for patterns that indicate type vs value
  const typeIndicators = edges.filter(
    (e) =>
      e.targetNodeName === 'boolean' ||
      e.targetNodeName === 'Boolean' ||
      e.targetNodeType === 'constructor' ||
      (e.targetNodeType === 'hidden' && e.targetNodeName && ['boolean', 'Boolean', 'type', 'constructor'].includes(e.targetNodeName)),
  )

  const valueIndicators = edges.filter(
    (e) =>
      e.targetBooleanValue !== null || (e.targetNodeType === 'hidden' && e.targetNodeName && ['true', 'false'].includes(e.targetNodeName)),
  )

  return {
    totalEdges: edges.length,
    propertyEdges: propertyEdges.length,
    internalEdges: internalEdges.length,
    possibleTypeEdges: typeIndicators,
    possibleValueEdges: valueIndicators,
    pattern: determineBooleanPattern(propertyEdges, internalEdges, typeIndicators, valueIndicators),
  }
}

const determineBooleanPattern = (propertyEdges: any[], internalEdges: any[], typeEdges: any[], valueEdges: any[]): string => {
  if (propertyEdges.length === 1 && internalEdges.length >= 1) {
    if (valueEdges.length > 0 && typeEdges.length > 0) {
      return 'TYPE_VALUE_PAIR: Property edge to value, internal edge to type'
    } else if (valueEdges.length > 0) {
      return 'VALUE_ONLY: Property edge to value, internal edge unknown'
    } else if (typeEdges.length > 0) {
      return 'TYPE_ONLY: Property edge unknown, internal edge to type'
    }
  }

  if (propertyEdges.length === 1 && internalEdges.length === 0) {
    return 'SIMPLE_VALUE: Single property edge (traditional pattern)'
  }

  return 'UNKNOWN_PATTERN: Needs further analysis'
}

test('analyze boolean structure with type and value edges', (): void => {
  // Create a more accurate snapshot based on your understanding:
  // Node 75 has breakpointsExpanded property that requires BOTH:
  // 1. A connection to the boolean TYPE (node 1271 "boolean")
  // 2. A connection to the boolean VALUE (node 1403 "false")
  // prettier-ignore
  const snapshot: any = {
    node_count: 5,
    edge_count: 4,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [
        [
          'hidden',
          'array',
          'string',
          'object',
          'code',
          'closure',
          'regexp',
          'number',
          'native',
          'synthetic',
          'concatenated string',
          'sliced string',
          'symbol',
          'bigint',
        ],
      ],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    nodes: new Uint32Array([
      // Node 75: Object with breakpointsExpanded property
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      3, 1, 75, 100, 2, 0, 0,    // object "MainObject" id=75 size=100 edges=2

      // Node 1403: Boolean VALUE "false"
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      0, 2, 1403, 20, 0, 0, 0,   // hidden "false" id=1403 size=20 edges=0

      // Node 1271: Boolean TYPE "boolean"
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      0, 3, 1271, 20, 0, 0, 0,   // hidden "boolean" id=1271 size=20 edges=0

      // Node 50: Another object for comparison
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      3, 4, 50, 50, 1, 0, 0,     // object "Object50" id=50 size=50 edges=1

      // Node 999: Boolean VALUE "true" for comparison
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      0, 5, 999, 20, 0, 0, 0,    // hidden "true" id=999 size=20 edges=0
    ]),
    edges: new Uint32Array([
      // Edge 0: breakpointsExpanded property -> false VALUE
      // [type, name_or_index, to_node]
      2, 6, 7,   // property "breakpointsExpanded" -> Node_1403 (offset 7)

      // Edge 1: internal edge -> boolean TYPE
      // [type, name_or_index, to_node]
      3, 0, 14,  // internal -> Node_1271 "boolean" (offset 14)

      // Edge 2: someFlag property -> true VALUE
      // [type, name_or_index, to_node]
      2, 7, 28,  // property "someFlag" -> Node_999 (offset 28)

      // Edge 3: internal edge -> boolean TYPE (shared)
      // [type, name_or_index, to_node]
      3, 0, 14,  // internal -> Node_1271 "boolean" (offset 14, shared type)
    ]),
    strings: ['', 'MainObject', 'false', 'boolean', 'Object50', 'true', 'breakpointsExpanded', 'someFlag'],
    locations: new Uint32Array([]),
  }

  console.log('\n=== Boolean Structure Analysis ===')

  // Analyze Node 75's breakpointsExpanded property
  const node75Analysis = analyzeBooleanStructure(snapshot, 75, 'breakpointsExpanded')
  console.log('\nNode 75 breakpointsExpanded analysis:')
  console.log(JSON.stringify(node75Analysis, null, 2))

  // Analyze Node 50's someFlag property for comparison
  const node50Analysis = analyzeBooleanStructure(snapshot, 50, 'someFlag')
  console.log('\nNode 50 someFlag analysis:')
  console.log(JSON.stringify(node50Analysis, null, 2))

  // Verify our analysis
  expect(node75Analysis.relatedEdges).toHaveLength(2) // Should find both property and internal edges
  expect(node75Analysis.analysis.pattern).toContain('TYPE_VALUE_PAIR')

  // Look for the specific pattern:
  // - Property edge to false value (1403)
  // - Internal edge to boolean type (1271)
  const valueEdge = node75Analysis.relatedEdges.find((e: any) => e.targetNodeId === 1403)
  const typeEdge = node75Analysis.relatedEdges.find((e: any) => e.targetNodeId === 1271)

  expect(valueEdge).toBeDefined()
  expect(valueEdge?.isDirectProperty).toBe(true)
  expect(valueEdge?.targetBooleanValue).toBe('false')

  expect(typeEdge).toBeDefined()
  expect(typeEdge?.isInternal).toBe(true)
  expect(typeEdge?.targetNodeName).toBe('boolean')
})

test('enhanced boolean detection in GetObjectsWithPropertiesInternal', async (): Promise<void> => {
  // Import is done for side effects and potential future use
  const { getObjectsWithPropertiesInternal } = await import(
    '../src/parts/GetObjectsWithPropertiesInternal/GetObjectsWithPropertiesInternal.ts'
  )

  // prettier-ignore
  const snapshot: any = {
    node_count: 3,
    edge_count: 2,
    extra_native_bytes: 0,
    meta: {
      node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
      node_types: [
        [
          'hidden',
          'array',
          'string',
          'object',
          'code',
          'closure',
          'regexp',
          'number',
          'native',
          'synthetic',
          'concatenated string',
          'sliced string',
          'symbol',
          'bigint',
        ],
      ],
      edge_fields: ['type', 'name_or_index', 'to_node'],
      edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
      location_fields: ['object_index', 'script_id', 'line', 'column'],
    },
    nodes: new Uint32Array([
      // Node 75: Object with breakpointsExpanded property
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      3, 1, 75, 100, 2, 0, 0,    // object "MainObject" id=75 size=100 edges=2

      // Node 1403: Boolean VALUE "false"
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      0, 2, 1403, 20, 0, 0, 0,   // hidden "false" id=1403 size=20 edges=0

      // Node 1271: Boolean TYPE "boolean"
      // [type, name, id, self_size, edge_count, trace_node_id, detachedness]
      0, 3, 1271, 20, 0, 0, 0,   // hidden "boolean" id=1271 size=20 edges=0
    ]),
    edges: new Uint32Array([
      // Edge 0: breakpointsExpanded property -> false VALUE
      // [type, name_or_index, to_node]
      2, 4, 7,   // property "breakpointsExpanded" -> Node_1403 (offset 7)

      // Edge 1: internal edge -> boolean TYPE
      // [type, name_or_index, to_node]
      3, 0, 14,  // internal -> Node_1271 "boolean" (offset 14)
    ]),
    strings: ['', 'MainObject', 'false', 'boolean', 'breakpointsExpanded'],
    locations: new Uint32Array([]),
  }

  console.log('\n=== Testing Enhanced Boolean Detection ===')

  const results = getObjectsWithPropertiesInternal(snapshot, 'breakpointsExpanded')
  console.log('Results:', JSON.stringify(results, null, 2))

  expect(results).toHaveLength(1)
  expect(results[0].id).toBe(75)
  expect(results[0].propertyValue).toBe(false) // Should detect the typed boolean pattern and return actual boolean
  expect(results[0].preview?.breakpointsExpanded).toBe(false) // Preview should also show actual boolean
})

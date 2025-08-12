import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import { getNodePreviews } from '../GetNodePreviews/GetNodePreviews.ts'
import { getObjectWithPropertyNodeIndices } from '../GetObjectWithPropertyNodeIndices/GetObjectWithPropertyNodeIndices.ts'
import { buildAstForNode } from '../GetNodePreviews/GetNodePreviewsAst.ts'
import type { AstNode } from '../AstNode/AstNode.ts'
import * as Timing from '../Timing/Timing.ts'
import type { ObjectWithProperty } from '../ObjectWithProperty/ObjectWithProperty.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

/**
 * Internal function that finds objects in a parsed heap snapshot that have a specific property
 * @param snapshot - The parsed heap snapshot object
 * @param propertyName - The property name to search for
 * @param depth - Maximum depth to traverse for property collection (default: 1)
 * @returns Array of objects with the specified property
 */
export const getObjectsWithPropertiesInternal = (snapshot: Snapshot, propertyName: string, depth: number = 1): ObjectWithProperty[] => {
  const tTotal = Timing.timeStart('GetObjectsWithPropertiesInternal.total')
  const { nodes, meta } = snapshot

  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields

  if (!nodeFields.length || !edgeFields.length) {
    return []
  }

  const tEdgeMap = Timing.timeStart('CreateEdgeMap.total')
  const edgeMap = createEdgeMap(nodes, nodeFields)
  Timing.timeEnd('CreateEdgeMap.total', tEdgeMap)

  // Precompute traversal indices and constants once
  const strings = snapshot.strings
  const nodeTypes = meta.node_types
  const edgeTypes = meta.edge_types[0] || []
  const ITEMS_PER_NODE = nodeFields.length
  const ITEMS_PER_EDGE = meta.edge_fields.length
  const edgeCountFieldIndex = nodeFields.indexOf('edge_count')
  const edgeTypeFieldIndex = meta.edge_fields.indexOf('type')
  const edgeNameFieldIndex = meta.edge_fields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = meta.edge_fields.indexOf('to_node')
  const idFieldIndex = nodeFields.indexOf('id')
  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')
  const EDGE_TYPE_INTERNAL = edgeTypes.indexOf('internal')
  const propertyNameIndex = strings.findIndex((s) => s === propertyName)
  const nodeTypeNames = nodeTypes[0] || []
  const NODE_TYPE_STRING = nodeTypeNames.indexOf('string')
  const NODE_TYPE_NUMBER = nodeTypeNames.indexOf('number')
  const NODE_TYPE_OBJECT = nodeTypeNames.indexOf('object')
  const NODE_TYPE_ARRAY = nodeTypeNames.indexOf('array')

  const tMatching = Timing.timeStart('GetObjectWithPropertyNodeIndices.total')
  const matchingNodeIndices = getObjectWithPropertyNodeIndices(
    snapshot,
    propertyName,
    ITEMS_PER_NODE,
    ITEMS_PER_EDGE,
    edgeTypeFieldIndex,
    edgeNameFieldIndex,
    edgeCountFieldIndex,
  )
  Timing.timeEnd('GetObjectWithPropertyNodeIndices.total', tMatching)

  const tPreviews = Timing.timeStart('GetNodePreviews.total')
  const results = getNodePreviews(
    matchingNodeIndices,
    snapshot,
    edgeMap,
    propertyName,
    depth,
    nodeFields,
    nodeTypes,
    meta.edge_fields,
    strings,
    ITEMS_PER_NODE,
    ITEMS_PER_EDGE,
    edgeCountFieldIndex,
    edgeTypeFieldIndex,
    edgeNameFieldIndex,
    edgeToNodeFieldIndex,
    EDGE_TYPE_PROPERTY,
    EDGE_TYPE_INTERNAL,
    propertyNameIndex,
    NODE_TYPE_STRING,
    NODE_TYPE_NUMBER,
    NODE_TYPE_OBJECT,
    NODE_TYPE_ARRAY,
    idFieldIndex,
    ITEMS_PER_EDGE,
    edgeCountFieldIndex,
  )
  Timing.timeEnd('GetNodePreviews.total', tPreviews)

  Timing.timeEnd('GetObjectsWithPropertiesInternal.total', tTotal)
  return results
}

export const getObjectsWithPropertiesInternalAst = (snapshot: Snapshot, propertyName: string, depth: number = 1): AstNode[] => {
  const { nodes, meta } = snapshot
  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields
  if (!nodeFields.length || !edgeFields.length) {
    return []
  }

  const edgeMap = createEdgeMap(nodes, nodeFields)
  const strings = snapshot.strings
  const nodeTypes = meta.node_types
  const edgeTypes = meta.edge_types[0] || []
  const ITEMS_PER_NODE = nodeFields.length
  const ITEMS_PER_EDGE = edgeFields.length
  const edgeCountFieldIndex = nodeFields.indexOf('edge_count')
  const edgeTypeFieldIndex = edgeFields.indexOf('type')
  const edgeNameFieldIndex = edgeFields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edgeFields.indexOf('to_node')
  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')
  const EDGE_TYPE_INTERNAL = edgeTypes.indexOf('internal')

  const matchingNodeIndices = getObjectWithPropertyNodeIndices(
    snapshot,
    propertyName,
    ITEMS_PER_NODE,
    ITEMS_PER_EDGE,
    edgeTypeFieldIndex,
    edgeNameFieldIndex,
    edgeCountFieldIndex,
  )

  const result: AstNode[] = []
  for (const nodeIndex of matchingNodeIndices) {
    const ast = buildAstForNode(
      nodeIndex,
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
      depth,
      new Set(),
    )
    if (ast) {
      result.push(ast)
    }
  }
  return result
}

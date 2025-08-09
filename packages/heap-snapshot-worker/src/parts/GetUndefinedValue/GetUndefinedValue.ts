import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'
import { getNodeEdges } from '../GetNodeEdges/GetNodeEdges.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'

// Cache for undefined nodes analysis to avoid re-scanning the entire snapshot
let undefinedNodesCache: Map<string, { undefinedNodeId: number | null }> | null = null

/**
 * Analyzes the entire snapshot to identify undefined singleton nodes
 * This is done by looking for hidden nodes with name "undefined"
 */
const analyzeUndefinedNodes = (snapshot: Snapshot): { undefinedNodeId: number | null } => {
  const { nodes, strings, meta } = snapshot
  const nodeFields = meta.node_fields

  // Create a snapshot hash for caching
  const snapshotHash = `${nodes.length}-${strings.length}`
  if (undefinedNodesCache?.has(snapshotHash)) {
    return undefinedNodesCache.get(snapshotHash)!
  }

  const ITEMS_PER_NODE = nodeFields.length
  const nameFieldIndex = nodeFields.indexOf('name')
  const typeFieldIndex = nodeFields.indexOf('type')
  const idFieldIndex = nodeFields.indexOf('id')

  // Find the string index for "undefined"
  const undefinedStringIndex = strings.findIndex((str) => str === 'undefined')

  let undefinedNodeId: number | null = null

  if (undefinedStringIndex !== -1) {
    // Find nodes with name "undefined" and type "hidden"
    for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
      const nameIndex = nodes[i + nameFieldIndex]
      const typeIndex = nodes[i + typeFieldIndex]
      const nodeId = nodes[i + idFieldIndex]

      if (nameIndex === undefinedStringIndex) {
        const nodeTypeName = meta.node_types[0] ? meta.node_types[0][typeIndex] : 'unknown'

        // The undefined singleton is typically a hidden type node
        if (nodeTypeName === 'hidden') {
          undefinedNodeId = nodeId
          break // Take the first one found
        }
      }
    }
  }

  const result = { undefinedNodeId }

  // Cache the result
  if (!undefinedNodesCache) {
    undefinedNodesCache = new Map()
  }
  undefinedNodesCache.set(snapshotHash, result)

  return result
}

/**
 * Attempts to determine if a node represents an undefined value
 * @param targetNode - The node to check
 * @param snapshot - The heap snapshot data
 * @param edgeMap - Edge mapping for efficient traversal
 * @param propertyName - The property name this node is referenced by (for context)
 * @returns '[undefined nodeId]' if the node represents undefined, null otherwise
 */
export const getUndefinedValue = (targetNode: any, snapshot: Snapshot, edgeMap: Uint32Array, propertyName?: string): string | null => {
  if (!targetNode) return null

  const nodeTypeName = getNodeTypeName(targetNode, snapshot.meta.node_types)
  const nodeName = getNodeName(targetNode, snapshot.strings)

  // Check if the node name explicitly indicates undefined
  if (nodeName === 'undefined' && nodeTypeName === 'hidden') {
    return `[undefined ${targetNode.id}]`
  }

  // Use snapshot analysis to identify undefined singleton
  const { undefinedNodeId } = analyzeUndefinedNodes(snapshot)

  if (targetNode.id === undefinedNodeId) {
    return `[undefined ${targetNode.id}]`
  }

  return null
}

/**
 * Enhanced undefined detection that looks for the dual-reference pattern:
 * - Property edge pointing to undefined value
 * - Internal edge pointing to undefined type (if present)
 * @param sourceNode - The node that has the undefined property
 * @param snapshot - The heap snapshot data
 * @param edgeMap - Edge mapping for efficient traversal
 * @param propertyName - The property name to analyze
 * @returns Object with undefined value and type information, or null if not undefined
 */
export const getUndefinedStructure = (
  sourceNode: any,
  snapshot: Snapshot,
  edgeMap: Uint32Array,
  propertyName: string,
): { value: string; hasTypeReference: boolean } | null => {
  if (!sourceNode) return null

  const { nodes, edges, strings, meta } = snapshot
  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields
  const ITEMS_PER_NODE = nodeFields.length

  // Find the source node index
  const idFieldIndex = nodeFields.indexOf('id')
  let sourceNodeIndex = -1
  for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
    if (nodes[i + idFieldIndex] === sourceNode.id) {
      sourceNodeIndex = i / ITEMS_PER_NODE
      break
    }
  }

  if (sourceNodeIndex === -1) return null

  // Get edges for this node
  const nodeEdges = getNodeEdges(sourceNodeIndex, edgeMap, nodes, edges, nodeFields, edgeFields)

  // Find property name index
  const propertyNameIndex = strings.findIndex((str) => str === propertyName)
  if (propertyNameIndex === -1) return null

  // Get edge type indices
  const edgeTypes = meta.edge_types[0] || []
  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')
  const EDGE_TYPE_INTERNAL = edgeTypes.indexOf('internal')

  let undefinedValue: string | null = null
  let hasTypeReference = false

  // Analyze edges to find undefined pattern
  for (const edge of nodeEdges) {
    const targetNodeIndex = Math.floor(edge.toNode / ITEMS_PER_NODE)
    const targetNode = parseNode(targetNodeIndex, nodes, nodeFields)
    if (!targetNode) continue

    const targetNodeName = getNodeName(targetNode, strings)

    // Check for property edge to undefined value
    if (edge.type === EDGE_TYPE_PROPERTY && edge.nameIndex === propertyNameIndex) {
      const valueCheck = getUndefinedValue(targetNode, snapshot, edgeMap, propertyName)
      if (valueCheck) {
        undefinedValue = valueCheck
      }
    }

    // Check for internal edge to undefined type (this might not exist for undefined)
    if (edge.type === EDGE_TYPE_INTERNAL && targetNodeName === 'undefined') {
      hasTypeReference = true
    }
  }

  if (undefinedValue) {
    return {
      value: undefinedValue,
      hasTypeReference: hasTypeReference,
    }
  }

  return null
}

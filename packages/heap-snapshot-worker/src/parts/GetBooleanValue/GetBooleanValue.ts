import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { getNodeName } from '../GetNodeName/GetNodeName.ts'
import { getNodeTypeName } from '../GetNodeTypeName/GetNodeTypeName.ts'
import { getNodeEdgesFast } from '../GetNodeEdgesFast/GetNodeEdgesFast.ts'
import { parseNode } from '../ParseNode/ParseNode.ts'

// Cache for boolean nodes analysis to avoid re-scanning the entire snapshot
let booleanNodesCache: Map<string, { trueNodeId: number | null; falseNodeId: number | null }> | null = null

/**
 * Analyzes the entire snapshot to identify boolean singleton nodes
 * This is done by looking for hidden nodes that are frequently referenced
 * by boolean-like property names
 */
const analyzeBooleanNodes = (snapshot: Snapshot): { trueNodeId: number | null; falseNodeId: number | null } => {
  const { nodes, edges, strings, meta } = snapshot
  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields

  // Create a snapshot hash for caching
  const snapshotHash = `${nodes.length}-${edges.length}-${strings.length}`
  if (booleanNodesCache?.has(snapshotHash)) {
    return booleanNodesCache.get(snapshotHash)!
  }

  const ITEMS_PER_NODE = nodeFields.length
  const ITEMS_PER_EDGE = edgeFields.length

  // Get field indices
  const typeFieldIndex = nodeFields.indexOf('type')
  const edgeCountFieldIndex = nodeFields.indexOf('edge_count')
  const nameFieldIndex = nodeFields.indexOf('name')

  const edgeTypeFieldIndex = edgeFields.indexOf('type')
  const edgeNameFieldIndex = edgeFields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edgeFields.indexOf('to_node')

  // Get edge type indices and node type ids
  const edgeTypes = meta.edge_types[0] || []
  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')
  const nodeTypeNames = meta.node_types[0] || []
  const NODE_TYPE_HIDDEN = nodeTypeNames.indexOf('hidden')

  // Count references to hidden nodes from boolean-like property names
  const hiddenNodeRefs = new Map<number, { booleanLikeRefs: number; totalRefs: number; propertyNames: string[] }>()

  // Pre-allocate indicators and avoid per-iteration allocations
  const booleanIndicators = [
    'expanded',
    'visible',
    'enabled',
    'disabled',
    'active',
    'inactive',
    'selected',
    'checked',
    'open',
    'closed',
    'valid',
    'invalid',
    'readonly',
    'hidden',
    'shown',
    'loading',
    'loaded',
    'required',
    'optional',
    'focused',
    'blurred',
    'collapsed',
  ] as const

  // Scan all edges to find property references to hidden nodes
  for (let i = 0; i < edges.length; i += ITEMS_PER_EDGE) {
    const edgeType = edges[i + edgeTypeFieldIndex]
    if (edgeType !== EDGE_TYPE_PROPERTY) {
      continue
    }

    const propertyNameIndex = edges[i + edgeNameFieldIndex]
    const targetNodeDataIndex = edges[i + edgeToNodeFieldIndex]

    if (propertyNameIndex >= strings.length || targetNodeDataIndex >= nodes.length) {
      continue
    }

    const propertyName = strings[propertyNameIndex]
    if (!propertyName) {
      continue
    }

    // Read the target node fields directly (no object allocation)
    const targetNodeIndex = Math.floor(targetNodeDataIndex / ITEMS_PER_NODE)
    const targetNodeStart = targetNodeIndex * ITEMS_PER_NODE
    const targetNodeTypeId = nodes[targetNodeStart + typeFieldIndex]
    const targetNodeEdgeCount = nodes[targetNodeStart + edgeCountFieldIndex]

    // Check if target is a hidden node with no outgoing edges (singleton pattern)
    if (targetNodeTypeId !== NODE_TYPE_HIDDEN) {
      continue
    }
    if (targetNodeEdgeCount !== 0) {
      continue
    }

    // Check if property name seems boolean-like
    const lowerPropName = propertyName.toLowerCase()
    let isBooleanLike = false
    for (let b = 0; b < booleanIndicators.length; b++) {
      if (lowerPropName.includes(booleanIndicators[b])) {
        isBooleanLike = true
        break
      }
    }
    if (!isBooleanLike) {
      if (lowerPropName.startsWith('is') || lowerPropName.startsWith('has')) {
        isBooleanLike = true
      }
    }

    // Track references to this hidden node
    const targetNodeId = nodes[targetNodeStart + nameFieldIndex] // we don't actually need the id yet; fix below
    // We do need the node id; it's stored under field 'id'
    const idFieldIndex = nodeFields.indexOf('id')
    const targetId = nodes[targetNodeStart + idFieldIndex]
    if (!hiddenNodeRefs.has(targetId)) {
      hiddenNodeRefs.set(targetId, { booleanLikeRefs: 0, totalRefs: 0, propertyNames: [] })
    }

    const nodeRef = hiddenNodeRefs.get(targetId)!
    nodeRef.totalRefs++
    nodeRef.propertyNames.push(propertyName)

    if (isBooleanLike) {
      nodeRef.booleanLikeRefs++
    }
  }

  // Find the two hidden nodes with the most boolean-like references
  const candidates = Array.from(hiddenNodeRefs.entries())
    .filter(([_, ref]) => ref.booleanLikeRefs >= 1)
    .sort((a, b) => b[1].booleanLikeRefs - a[1].booleanLikeRefs)
    .slice(0, 2)

  let trueNodeId: number | null = null
  let falseNodeId: number | null = null

  if (candidates.length >= 2) {
    const [id1] = candidates[0]
    const [id2] = candidates[1]
    if (id1 < id2) {
      trueNodeId = id1
      falseNodeId = id2
    } else {
      trueNodeId = id2
      falseNodeId = id1
    }
  }

  const result = { trueNodeId, falseNodeId }

  if (!booleanNodesCache) {
    booleanNodesCache = new Map()
  }
  booleanNodesCache.set(snapshotHash, result)

  return result
}

/**
 * Attempts to determine if a node represents a boolean value (true/false)
 * This handles both simple boolean singletons and the dual-reference pattern
 * where booleans have both type and value references
 * @param targetNode - The node to check
 * @param snapshot - The heap snapshot data
 * @param edgeMap - Edge mapping for efficient traversal
 * @param propertyName - The property name this node is referenced by (for context)
 * @returns The boolean value as string ('true', 'false') or null if not a boolean
 */
export const getBooleanValue = (targetNode: any, snapshot: Snapshot, edgeMap: Uint32Array, propertyName?: string): string | null => {
  if (!targetNode) return null

  const nodeTypeName = getNodeTypeName(targetNode, snapshot.meta.node_types)

  // Booleans are typically 'hidden' type nodes
  if (nodeTypeName !== 'hidden') return null

  const nodeName = getNodeName(targetNode, snapshot.strings)

  // Check if the node name explicitly indicates a boolean value
  if (nodeName === 'true' || nodeName === 'false') {
    return nodeName
  }

  // If this is a type node (name "boolean"), check if it's part of a boolean structure
  if (nodeName === 'boolean') {
    // Type nodes themselves are not boolean values, but indicate boolean structure
    return null
  }

  // Use snapshot analysis to identify boolean singletons
  const { trueNodeId, falseNodeId } = analyzeBooleanNodes(snapshot)

  if (targetNode.id === trueNodeId) {
    return 'true'
  }

  if (targetNode.id === falseNodeId) {
    return 'false'
  }

  return null
}

/**
 * Enhanced boolean detection that looks for the dual-reference pattern:
 * - Property edge pointing to boolean value (true/false)
 * - Internal edge pointing to boolean type ("boolean")
 * @param sourceNode - The node that has the boolean property
 * @param snapshot - The heap snapshot data
 * @param edgeMap - Edge mapping for efficient traversal
 * @param propertyName - The property name to analyze
 * @returns Object with boolean value and type information, or null if not a boolean
 */
export const getBooleanStructure = (
  sourceNode: any,
  snapshot: Snapshot,
  edgeMap: Uint32Array,
  propertyName: string,
  sourceNodeIndex: number,
  nodeFields: readonly string[],
  ITEMS_PER_NODE: number,
  ITEMS_PER_EDGE: number,
  edgeCountFieldIndex: number,
  edgeTypeFieldIndex: number,
  edgeNameFieldIndex: number,
  edgeToNodeFieldIndex: number,
  EDGE_TYPE_PROPERTY: number,
  EDGE_TYPE_INTERNAL: number,
  propertyNameIndexOverride?: number,
): { value: string; hasTypeReference: boolean } | null => {
  if (!sourceNode) return null

  const { nodes, edges, strings } = snapshot

  // sourceNodeIndex is provided by the caller to avoid a full scan
  if (sourceNodeIndex < 0) return null

  // Get edges for this node (as subarray)
  const nodeEdges = getNodeEdgesFast(sourceNodeIndex, edgeMap, nodes, edges, ITEMS_PER_NODE, ITEMS_PER_EDGE, edgeCountFieldIndex)

  // Find property name index (caller may pass it to avoid repeated lookup)
  const propertyNameIndex =
    typeof propertyNameIndexOverride === 'number' && propertyNameIndexOverride >= 0
      ? propertyNameIndexOverride
      : strings.findIndex((str) => str === propertyName)
  if (propertyNameIndex === -1) return null

  // Get edge type indices
  // EDGE_TYPE_* are provided

  let booleanValue: string | null = null
  let hasTypeReference = false

  // Analyze edges to find boolean pattern
  // Field indices and counts provided
  const nameFieldIndex = nodeFields.indexOf('name')
  const idFieldIndex = nodeFields.indexOf('id')
  for (let i = 0; i < nodeEdges.length; i += ITEMS_PER_EDGE) {
    const type = nodeEdges[i + edgeTypeFieldIndex]
    const nameIndex = nodeEdges[i + edgeNameFieldIndex]
    const toNode = nodeEdges[i + edgeToNodeFieldIndex]
    const targetNodeIndex = Math.floor(toNode / ITEMS_PER_NODE)
    const targetNodeStart = targetNodeIndex * ITEMS_PER_NODE
    const targetNodeNameIndex = nodes[targetNodeStart + nameFieldIndex]
    const targetNodeName = targetNodeNameIndex >= 0 && targetNodeNameIndex < strings.length ? strings[targetNodeNameIndex] : null

    // Check for property edge to boolean value
    if (type === EDGE_TYPE_PROPERTY && nameIndex === propertyNameIndex) {
      const targetNodeMinimal: any = {
        type: nodes[targetNodeStart + nodeFields.indexOf('type')],
        id: nodes[targetNodeStart + idFieldIndex],
        name: targetNodeNameIndex,
        edge_count: nodes[targetNodeStart + edgeCountFieldIndex],
      }
      const valueCheck = getBooleanValue(targetNodeMinimal, snapshot, edgeMap, propertyName)
      if (valueCheck) {
        booleanValue = valueCheck
      }
    }

    // Check for internal edge to boolean type
    if (type === EDGE_TYPE_INTERNAL && targetNodeName === 'boolean') {
      hasTypeReference = true
    }
  }

  if (booleanValue) {
    return {
      value: booleanValue,
      hasTypeReference: hasTypeReference,
    }
  }

  return null
}

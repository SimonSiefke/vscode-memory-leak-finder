import type { AstNode, ObjectNode } from '../AstNode/AstNode.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import type { ClosureLocation } from '../ClosureLocation/ClosureLocation.ts'
import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import { getNodeEdgesFast } from '../GetNodeEdgesFast/GetNodeEdgesFast.ts'
import { isObjectNode } from '../IsObjectNode/IsObjectNode.ts'

export const addLocationsToAstNodes = (snapshot: Snapshot, nodes: readonly AstNode[]): readonly AstNode[] => {
  // Collect target object ids from AST nodes
  const targetIds = new Set<number>()
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (isObjectNode(node)) {
      targetIds.add(node.id)
    }
  }

  if (targetIds.size === 0) {
    return nodes
  }

  const { nodes: heapNodes, edges, meta, locations } = snapshot
  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields
  const nodeTypes = meta.node_types[0] || []
  const edgeTypes = meta.edge_types[0] || []

  if (!nodeFields.length || !edgeFields.length) {
    return nodes
  }

  const ITEMS_PER_NODE = nodeFields.length
  const ITEMS_PER_EDGE = edgeFields.length

  const typeFieldIndex = nodeFields.indexOf('type')
  const idFieldIndex = nodeFields.indexOf('id')
  const edgeCountFieldIndex = nodeFields.indexOf('edge_count')
  const traceNodeIdFieldIndex = nodeFields.indexOf('trace_node_id')

  const edgeTypeFieldIndex = edgeFields.indexOf('type')
  const edgeToNodeFieldIndex = edgeFields.indexOf('to_node')

  if (
    typeFieldIndex === -1 ||
    idFieldIndex === -1 ||
    edgeCountFieldIndex === -1 ||
    edgeTypeFieldIndex === -1 ||
    edgeToNodeFieldIndex === -1
  ) {
    return nodes
  }

  const NODE_TYPE_CLOSURE = nodeTypes.indexOf('closure')
  const EDGE_TYPE_CONTEXT = edgeTypes.indexOf('context')
  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')

  if (NODE_TYPE_CLOSURE === -1 || EDGE_TYPE_CONTEXT === -1 || EDGE_TYPE_PROPERTY === -1) {
    return nodes
  }

  // Build a map from absolute node offset to object id, but only for target ids
  const absOffsetToTargetId = new Map<number, number>()
  for (let nodeOffset = 0; nodeOffset < heapNodes.length; nodeOffset += ITEMS_PER_NODE) {
    const id = heapNodes[nodeOffset + idFieldIndex]
    if (targetIds.has(id)) {
      absOffsetToTargetId.set(nodeOffset, id)
    }
  }

  if (absOffsetToTargetId.size === 0) {
    return nodes
  }

  // Precompute location maps for closures to avoid O(L) scans per closure
  const location_fields = meta.location_fields
  const hasLocations = Boolean(location_fields?.length && locations?.length)
  const objectIndexOffset = hasLocations ? location_fields.indexOf('object_index') : -1
  const scriptIdOffset = hasLocations ? location_fields.indexOf('script_id') : -1
  const lineOffset = hasLocations ? location_fields.indexOf('line') : -1
  const columnOffset = hasLocations ? location_fields.indexOf('column') : -1
  const itemsPerLocation = hasLocations ? location_fields.length : 0

  // Build result mapping: object id -> array of unique closure locations
  const result = new Map<number, ClosureLocation[]>()
  const dedupeById = new Map<number, Set<string>>()

  const closureIndexToLocation = new Map<number, ClosureLocation>()
  const traceNodeToLocation = new Map<number, ClosureLocation>()

  if (hasLocations && objectIndexOffset !== -1 && scriptIdOffset !== -1 && lineOffset !== -1 && columnOffset !== -1) {
    for (let i = 0; i < locations.length; i += itemsPerLocation) {
      const objectIndexAbs = locations[i + objectIndexOffset]
      const objectIndexValue = objectIndexAbs / ITEMS_PER_NODE
      const loc: ClosureLocation = {
        scriptId: locations[i + scriptIdOffset],
        line: locations[i + lineOffset],
        column: locations[i + columnOffset],
      }
      // Map closure node index to location for closure-captured analysis
      closureIndexToLocation.set(objectIndexValue, loc)
      // If the location points directly to one of our target object nodes, record it immediately
      const targetIdFromAbs = absOffsetToTargetId.get(objectIndexAbs)
      if (targetIdFromAbs !== undefined) {
        let list = result.get(targetIdFromAbs)
        if (!list) {
          list = []
          result.set(targetIdFromAbs, list)
        }
        let seen = dedupeById.get(targetIdFromAbs)
        if (!seen) {
          seen = new Set<string>()
          dedupeById.set(targetIdFromAbs, seen)
        }
        const key = `${loc.scriptId}:${loc.line}:${loc.column}`
        if (!seen.has(key)) {
          seen.add(key)
          list.push(loc)
        }
      }
    }
  }

  const getLocationForClosureIndex = (closureIndex: number): ClosureLocation | null => {
    if (!hasLocations) {
      return null
    }
    const fromIndex = closureIndexToLocation.get(closureIndex)
    if (fromIndex) {
      return fromIndex
    }
    if (traceNodeIdFieldIndex !== -1) {
      const traceNodeId = heapNodes[closureIndex * ITEMS_PER_NODE + traceNodeIdFieldIndex]
      if (typeof traceNodeId === 'number' && traceNodeId !== 0) {
        const fromTrace = traceNodeToLocation.get(traceNodeId)
        if (fromTrace) {
          return fromTrace
        }
      }
    }
    return null
  }

  const edgeMap = createEdgeMap(heapNodes, nodeFields)

  for (let nodeOffset = 0; nodeOffset < heapNodes.length; nodeOffset += ITEMS_PER_NODE) {
    const typeIndex = heapNodes[nodeOffset + typeFieldIndex]
    if (typeIndex !== NODE_TYPE_CLOSURE) {
      continue
    }
    const closureIndex = nodeOffset / ITEMS_PER_NODE

    // Find context node of this closure
    const closureEdges = getNodeEdgesFast(closureIndex, edgeMap, heapNodes, edges, ITEMS_PER_NODE, ITEMS_PER_EDGE, edgeCountFieldIndex)

    let contextNodeIndex = -1
    for (let i = 0; i < closureEdges.length; i += ITEMS_PER_EDGE) {
      const eType = closureEdges[i + edgeTypeFieldIndex]
      if (eType === EDGE_TYPE_CONTEXT) {
        const toNodeAbs = closureEdges[i + edgeToNodeFieldIndex]
        contextNodeIndex = Math.floor(toNodeAbs / ITEMS_PER_NODE)
        break
      }
    }
    if (contextNodeIndex === -1) {
      continue
    }

    const loc = getLocationForClosureIndex(closureIndex)
    if (!loc) {
      // No source location; still scan but nothing to record
      // Continue since without a location we cannot provide useful info
      continue
    }

    // Scan context properties to see which of our targets are captured
    const contextEdges = getNodeEdgesFast(contextNodeIndex, edgeMap, heapNodes, edges, ITEMS_PER_NODE, ITEMS_PER_EDGE, edgeCountFieldIndex)
    for (let i = 0; i < contextEdges.length; i += ITEMS_PER_EDGE) {
      const eType = contextEdges[i + edgeTypeFieldIndex]
      if (eType !== EDGE_TYPE_PROPERTY) {
        continue
      }
      const toNodeAbs = contextEdges[i + edgeToNodeFieldIndex]
      const capturedId = absOffsetToTargetId.get(toNodeAbs)
      if (capturedId === undefined) {
        continue
      }

      let list = result.get(capturedId)
      if (!list) {
        list = []
        result.set(capturedId, list)
      }
      let seen = dedupeById.get(capturedId)
      if (!seen) {
        seen = new Set<string>()
        dedupeById.set(capturedId, seen)
      }
      const key = `${loc.scriptId}:${loc.line}:${loc.column}`
      if (!seen.has(key)) {
        seen.add(key)
        list.push(loc)
      }
    }
  }

  // Apply results to AST nodes
  return nodes.map((node) => {
    if (isObjectNode(node)) {
      const locationsForId = result.get(node.id) || []
      if (locationsForId.length) {
        const withLocations: ObjectNode = { ...node, closureLocations: locationsForId }
        return withLocations
      }
    }
    return node
  })
}

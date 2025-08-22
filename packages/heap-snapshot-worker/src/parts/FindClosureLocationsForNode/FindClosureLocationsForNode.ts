import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import { getNodeEdgesFast } from '../GetNodeEdgesFast/GetNodeEdgesFast.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import type { ClosureLocation } from '../ClosureLocation/ClosureLocation.ts'

const findNodeIndexById = (snapshot: Snapshot, objectId: number): number => {
  const nodes = snapshot.nodes
  const nodeFields = snapshot.meta.node_fields
  const idFieldIndex = nodeFields.indexOf('id')
  const ITEMS_PER_NODE = nodeFields.length
  if (idFieldIndex === -1) {
    return -1
  }
  for (let nodeOffset = 0; nodeOffset < nodes.length; nodeOffset += ITEMS_PER_NODE) {
    const id = nodes[nodeOffset + idFieldIndex]
    if (id === objectId) {
      return nodeOffset / ITEMS_PER_NODE
    }
  }
  return -1
}

export const getLocationForClosureIndex = (
  snapshot: Snapshot,
  closureNodeIndex: number,
  ITEMS_PER_NODE: number,
  traceNodeIdFieldIndex: number,
): ClosureLocation | null => {
  const { locations, meta } = snapshot
  const location_fields = meta.location_fields
  if (!location_fields?.length || !locations?.length) {
    return null
  }
  const objectIndexOffset = location_fields.indexOf('object_index')
  const scriptIdOffset = location_fields.indexOf('script_id')
  const lineOffset = location_fields.indexOf('line')
  const columnOffset = location_fields.indexOf('column')
  const itemsPerLocation = location_fields.length

  const traceNodeId = snapshot.nodes[closureNodeIndex * ITEMS_PER_NODE + traceNodeIdFieldIndex]

  for (let i = 0; i < locations.length; i += itemsPerLocation) {
    const objectIndexValue = locations[i + objectIndexOffset] / ITEMS_PER_NODE
    const matchesTrace = typeof traceNodeId === 'number' && traceNodeId !== 0 && objectIndexValue === traceNodeId
    const matchesIndex = objectIndexValue === closureNodeIndex
    if (matchesTrace || matchesIndex) {
      return {
        scriptId: locations[i + scriptIdOffset],
        line: locations[i + lineOffset],
        column: locations[i + columnOffset],
      }
    }
  }
  return null
}

export const findClosureLocationsForObjectId = (snapshot: Snapshot, objectId: number): readonly ClosureLocation[] => {
  const { nodes, edges, meta, locations } = snapshot
  const nodeFields = meta.node_fields
  const nodeTypes = meta.node_types[0] || []
  const edgeFields = meta.edge_fields
  const edgeTypes = meta.edge_types[0] || []

  if (!nodeFields.length || !edgeFields.length || !locations?.length) {
    return []
  }

  const ITEMS_PER_NODE = nodeFields.length
  const ITEMS_PER_EDGE = edgeFields.length
  const typeFieldIndex = nodeFields.indexOf('type')
  const idFieldIndex = nodeFields.indexOf('id')
  const traceNodeIdFieldIndex = nodeFields.indexOf('trace_node_id')
  const edgeCountFieldIndex = nodeFields.indexOf('edge_count')
  const edgeTypeFieldIndex = edgeFields.indexOf('type')
  const edgeNameFieldIndex = edgeFields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edgeFields.indexOf('to_node')

  const NODE_TYPE_CLOSURE = nodeTypes.indexOf('closure')
  const EDGE_TYPE_CONTEXT = edgeTypes.indexOf('context')
  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')

  const { length: L } = nodes
  const edgeMap = createEdgeMap(nodes, nodeFields)

  const targetNodeIndex = findNodeIndexById(snapshot, objectId)
  if (targetNodeIndex === -1) {
    return []
  }
  const targetNodeAbsolute = targetNodeIndex * ITEMS_PER_NODE

  const results: ClosureLocation[] = []
  const seen = new Set<string>()

  for (let nodeOffset = 0; nodeOffset < L; nodeOffset += ITEMS_PER_NODE) {
    const nodeIndex = nodeOffset / ITEMS_PER_NODE
    const typeIndex = nodes[nodeOffset + typeFieldIndex]
    if (typeIndex !== NODE_TYPE_CLOSURE) {
      continue
    }

    const closureEdges = getNodeEdgesFast(nodeIndex, edgeMap, nodes, edges, ITEMS_PER_NODE, ITEMS_PER_EDGE, edgeCountFieldIndex)
    // Find its context node
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

    // Scan context properties to see if our target is referenced directly
    const contextEdges = getNodeEdgesFast(
      contextNodeIndex,
      edgeMap,
      nodes,
      edges,
      ITEMS_PER_NODE,
      ITEMS_PER_EDGE,
      edgeCountFieldIndex,
    )
    let isCaptured = false
    for (let i = 0; i < contextEdges.length; i += ITEMS_PER_EDGE) {
      const eType = contextEdges[i + edgeTypeFieldIndex]
      if (eType !== EDGE_TYPE_PROPERTY) {
        continue
      }
      const toNodeAbs = contextEdges[i + edgeToNodeFieldIndex]
      if (toNodeAbs === targetNodeAbsolute) {
        isCaptured = true
        break
      }
    }
    if (!isCaptured) {
      continue
    }

    const loc = getLocationForClosureIndex(snapshot, nodeIndex, ITEMS_PER_NODE, traceNodeIdFieldIndex)
    if (loc) {
      const key = `${loc.scriptId}:${loc.line}:${loc.column}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push(loc)
      }
    }
  }

  return results
}

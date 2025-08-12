import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import { getNodeEdgesFast } from '../GetNodeEdgesFast/GetNodeEdgesFast.ts'
import * as Timing from '../Timing/Timing.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

/**
 * Returns the node indices for all objects that have the given property name.
 * The returned indices are logical node indices (0-based), not array offsets.
 */
export const getObjectWithPropertyNodeIndices = (
  snapshot: Snapshot,
  propertyName: string,
  ITEMS_PER_NODE?: number,
  ITEMS_PER_EDGE?: number,
  edgeTypeFieldIndexParam?: number,
  edgeNameFieldIndexParam?: number,
  edgeCountFieldIndexParam?: number,
): number[] => {
  const tTotal = Timing.timeStart('GetObjectWithPropertyNodeIndices.scan')
  const { nodes, edges, strings, meta } = snapshot

  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields
  const edgeTypes = meta.edge_types[0] || []

  if (!nodeFields.length || !edgeFields.length) {
    return []
  }

  const propertyNameIndex = strings.findIndex((str) => str === propertyName)
  if (propertyNameIndex === -1) {
    return []
  }

  const ITEMS_PER_NODE_LOCAL = ITEMS_PER_NODE ?? nodeFields.length
  const ITEMS_PER_EDGE_LOCAL = ITEMS_PER_EDGE ?? edgeFields.length
  const edgeTypeFieldIndex = edgeTypeFieldIndexParam ?? edgeFields.indexOf('type')
  const edgeNameFieldIndex = edgeNameFieldIndexParam ?? edgeFields.indexOf('name_or_index')
  const edgeCountFieldIndex = edgeCountFieldIndexParam ?? nodeFields.indexOf('edge_count')

  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')

  const tEdgeMap = Timing.timeStart('CreateEdgeMap.total')
  const edgeMap = createEdgeMap(nodes, nodeFields)
  Timing.timeEnd('CreateEdgeMap.total', tEdgeMap)

  const result: number[] = []

  const tLoop = Timing.timeStart('GetObjectWithPropertyNodeIndices.loop')
  for (let nodeOffset = 0; nodeOffset < nodes.length; nodeOffset += ITEMS_PER_NODE_LOCAL) {
    const nodeIndex = nodeOffset / ITEMS_PER_NODE_LOCAL
    const nodeEdges = getNodeEdgesFast(
      nodeIndex,
      edgeMap,
      nodes,
      edges,
      ITEMS_PER_NODE_LOCAL,
      ITEMS_PER_EDGE_LOCAL,
      edgeCountFieldIndex,
    )

    for (let i = 0; i < nodeEdges.length; i += ITEMS_PER_EDGE_LOCAL) {
      const edgeType = nodeEdges[i + edgeTypeFieldIndex]
      const nameIndex = nodeEdges[i + edgeNameFieldIndex]
      if (edgeType === EDGE_TYPE_PROPERTY && nameIndex === propertyNameIndex) {
        result.push(nodeIndex)
        break
      }
    }
  }
  Timing.timeEnd('GetObjectWithPropertyNodeIndices.loop', tLoop)

  Timing.timeEnd('GetObjectWithPropertyNodeIndices.scan', tTotal)
  return result
}

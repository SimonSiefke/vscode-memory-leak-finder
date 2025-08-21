import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import { getNodeEdgesFast } from '../GetNodeEdgesFast/GetNodeEdgesFast.ts'
import * as Timing from '../Timing/Timing.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { getLocationsMap } from '../GetLocationsMap/GetLocationsMap.ts'

/**
 * Returns the node indices for all objects that have the given property name.
 * The returned indices are logical node indices (0-based), not array offsets.
 */
export const getObjectWithPropertyNodeIndices2 = (
  snapshot: Snapshot,
  propertyName: string,
  ITEMS_PER_NODE?: number,
  ITEMS_PER_EDGE?: number,
  edgeTypeFieldIndexParam?: number,
  edgeNameFieldIndexParam?: number,
  edgeCountFieldIndexParam?: number,
): Uint32Array => {
  const { nodes, edges, strings, meta, locations } = snapshot

  const nodeFields = meta.node_fields
  const nodeFieldCount = nodeFields.length
  const edgeFields = meta.edge_fields
  const edgeTypes = meta.edge_types[0] || []
  const scriptIdIndex = meta.location_fields.indexOf('script_id')
  const lineIndex = meta.location_fields.indexOf('line')
  const columnIndex = meta.location_fields.indexOf('column')

  if (!nodeFields.length || !edgeFields.length) {
    return new Uint32Array([])
  }

  const propertyNameIndex = strings.findIndex((str) => str === propertyName)
  if (propertyNameIndex === -1) {
    return new Uint32Array([])
  }

  const ITEMS_PER_NODE_LOCAL = ITEMS_PER_NODE ?? nodeFields.length
  const ITEMS_PER_EDGE_LOCAL = ITEMS_PER_EDGE ?? edgeFields.length
  const edgeTypeFieldIndex = edgeTypeFieldIndexParam ?? edgeFields.indexOf('type')
  const edgeNameFieldIndex = edgeNameFieldIndexParam ?? edgeFields.indexOf('name_or_index')
  const toNodeIndex = edgeNameFieldIndexParam ?? edgeFields.indexOf('to_node')
  const edgeCountFieldIndex = edgeCountFieldIndexParam ?? nodeFields.indexOf('edge_count')

  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')

  const edgeMap = createEdgeMap(nodes, nodeFields)
  const locationMap = getLocationsMap(snapshot)

  const result: number[] = []

  // let prev = ``
  for (let nodeOffset = 0; nodeOffset < nodes.length; nodeOffset += ITEMS_PER_NODE_LOCAL) {
    const nodeIndex = nodeOffset / ITEMS_PER_NODE_LOCAL
    const nodeEdges = getNodeEdgesFast(nodeIndex, edgeMap, nodes, edges, ITEMS_PER_NODE_LOCAL, ITEMS_PER_EDGE_LOCAL, edgeCountFieldIndex)

    for (let i = 0; i < nodeEdges.length; i += ITEMS_PER_EDGE_LOCAL) {
      const edgeType = nodeEdges[i + edgeTypeFieldIndex]
      const nameIndex = nodeEdges[i + edgeNameFieldIndex]
      if (edgeType === EDGE_TYPE_PROPERTY && nameIndex === propertyNameIndex) {
        const toNode = nodeEdges[i + toNodeIndex]
        // console.log({ toNode, nodeFieldCount, index: toNode / nodeFieldCount })
        const locationIndex = locationMap[toNode / nodeFieldCount]
        const scriptId = locations[locationIndex + scriptIdIndex]
        const line = locations[locationIndex + lineIndex]
        const column = locations[locationIndex + columnIndex]
        // const hash = `${scriptId}:${line}:${column}`
        // if (prev !== hash) {
        //   prev = hash
        //   console.log({ scriptId, line, column })
        // }
        result.push(nodeIndex, scriptId, line, column)
        break
      }
    }
  }
  return new Uint32Array(result)
}

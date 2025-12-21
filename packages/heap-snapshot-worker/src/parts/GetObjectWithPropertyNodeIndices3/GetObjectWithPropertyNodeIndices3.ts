import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import { matchesProperty } from '../MachesProperty/MatchesProperty.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

/**
 * Returns the node indices for all objects that have the given property name.
 * The returned indices are logical node indices (0-based), not array offsets.
 */
export const getObjectWithPropertyNodeIndices3 = (snapshot: Snapshot, propertyName: string): Uint32Array => {
  const { nodes, edges, strings, meta } = snapshot

  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields
  const edgeTypes = meta.edge_types[0] || []
  const nodeTypes = meta.node_types[0] || []

  if (!nodeFields.length || !edgeFields.length) {
    return new Uint32Array([])
  }

  const propertyNameIndex = strings.findIndex((str) => str === propertyName)
  if (propertyNameIndex === -1) {
    return new Uint32Array([])
  }

  const idIndex = nodeFields.indexOf('id')
  const ITEMS_PER_NODE_LOCAL = nodeFields.length
  const ITEMS_PER_EDGE_LOCAL = edgeFields.length
  const edgeTypeFieldIndex = edgeFields.indexOf('type')
  const edgeNameFieldIndex = edgeFields.indexOf('name_or_index')
  const edgeToNodeIndex = edgeFields.indexOf('to_node')

  const edgeCountFieldIndex = nodeFields.indexOf('edge_count')
  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')
  const EDGE_TYPE_INTERNAL = edgeTypes.indexOf('internal')
  const nodeTypeObject = nodeTypes.indexOf('object')
  const nodeTypeIndex = nodeFields.indexOf('type')

  const edgeMap = createEdgeMap(nodes, nodeFields)

  const result: number[] = []

  for (let nodeOffset = 0; nodeOffset < nodes.length; nodeOffset += ITEMS_PER_NODE_LOCAL) {
    if (
      nodes[nodeOffset + nodeTypeIndex] === nodeTypeObject &&
      matchesProperty(
        nodes,
        nodeOffset,
        ITEMS_PER_NODE_LOCAL,
        edges,
        ITEMS_PER_EDGE_LOCAL,
        edgeCountFieldIndex,
        edgeTypeFieldIndex,
        edgeNameFieldIndex,
        EDGE_TYPE_PROPERTY,
        EDGE_TYPE_INTERNAL,
        edgeToNodeIndex,
        propertyNameIndex,
        idIndex,
        strings,
        edgeMap,
      )
    ) {
      result.push(nodeOffset)
    }
  }
  return new Uint32Array(result)
}

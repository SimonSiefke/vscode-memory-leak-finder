import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import { getNodeEdgesFast } from '../GetNodeEdgesFast/GetNodeEdgesFast.ts'
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

  console.log({ nodeTypes, nodeFields })

  const idIndex = nodeFields.indexOf('id')
  const ITEMS_PER_NODE_LOCAL = nodeFields.length
  const ITEMS_PER_EDGE_LOCAL = edgeFields.length
  const edgeTypeFieldIndex = edgeFields.indexOf('type')
  const edgeNameFieldIndex = edgeFields.indexOf('name_or_index')
  const edgeToNodeIndex = edgeFields.indexOf('to_node')

  const edgeCountFieldIndex = nodeFields.indexOf('edge_count')
  console.log({ edgeFields, edgeTypes })
  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')
  const EDGE_TYPE_INTERNAL = edgeTypes.indexOf('internal')
  const nodeTypeObject = nodeTypes.indexOf('object')
  const nodeTypeIndex = nodeFields.indexOf('type')

  const edgeMap = createEdgeMap(nodes, nodeFields)

  const result: number[] = []

  const specialNodeIds = [
    7093, // instance before
    60081, // instance after

    58817, // map,

    58819, // prototype
    59725, // function
  ]

  // TODO
  // for each node
  // for each property
  //   if it matches the property name, add it to the list
  //   if the propertyname is of type map, visit the map
  //     for all properties of the map
  //       if the property name is prototype, visit it
  //
  // check if has a direct property with that name

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

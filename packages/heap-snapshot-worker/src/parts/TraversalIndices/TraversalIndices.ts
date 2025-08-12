import type { Snapshot } from '../Snapshot/Snapshot.ts'

export type TraversalIndices = {
  // raw
  nodeFields: readonly string[]
  edgeFields: readonly string[]
  nodeTypes: readonly (readonly string[])[]
  strings: readonly string[]

  // derived
  ITEMS_PER_NODE: number
  ITEMS_PER_EDGE: number

  // node field indices
  nodeIdFieldIndex: number
  nodeEdgeCountFieldIndex: number

  // edge field indices
  edgeTypeFieldIndex: number
  edgeNameFieldIndex: number
  edgeToNodeFieldIndex: number

  // edge type indices
  EDGE_TYPE_PROPERTY: number
  EDGE_TYPE_INTERNAL: number

  // property
  propertyNameIndex: number
}

export const createTraversalIndices = (snapshot: Snapshot, propertyName: string): TraversalIndices => {
  const { meta, strings } = snapshot
  const nodeFields = meta.node_fields
  const edgeFields = meta.edge_fields
  const nodeTypes = meta.node_types
  const edgeTypes = meta.edge_types[0] || []

  const ITEMS_PER_NODE = nodeFields.length
  const ITEMS_PER_EDGE = edgeFields.length

  const nodeIdFieldIndex = nodeFields.indexOf('id')
  const nodeEdgeCountFieldIndex = nodeFields.indexOf('edge_count')

  const edgeTypeFieldIndex = edgeFields.indexOf('type')
  const edgeNameFieldIndex = edgeFields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edgeFields.indexOf('to_node')

  const EDGE_TYPE_PROPERTY = edgeTypes.indexOf('property')
  const EDGE_TYPE_INTERNAL = edgeTypes.indexOf('internal')

  const propertyNameIndex = strings.findIndex((s) => s === propertyName)

  return {
    nodeFields,
    edgeFields,
    nodeTypes,
    strings,
    ITEMS_PER_NODE,
    ITEMS_PER_EDGE,
    nodeIdFieldIndex,
    nodeEdgeCountFieldIndex,
    edgeTypeFieldIndex,
    edgeNameFieldIndex,
    edgeToNodeFieldIndex,
    EDGE_TYPE_PROPERTY,
    EDGE_TYPE_INTERNAL,
    propertyNameIndex,
  }
}

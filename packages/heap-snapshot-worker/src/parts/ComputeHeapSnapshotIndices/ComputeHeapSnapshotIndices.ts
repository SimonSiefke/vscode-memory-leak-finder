interface HeapSnapshotIndices {
  // Type indices
  objectTypeIndex: number
  nativeTypeIndex: number
  bigintTypeIndex: number
  regexpTypeIndex: number

  // Items per record
  ITEMS_PER_NODE: number
  ITEMS_PER_EDGE: number

  // Node field indices
  typeFieldIndex: number
  nameFieldIndex: number
  idFieldIndex: number
  selfSizeFieldIndex: number
  edgeCountFieldIndex: number
  detachednessFieldIndex: number
  traceNodeIdFieldIndex: number

  // Edge field indices
  edgeTypeFieldIndex: number
  edgeNameFieldIndex: number
  edgeToNodeFieldIndex: number

  // Edge type names for reference
  edgeTypes: readonly string[]
  nodeTypes: readonly string[]
}

export const computeHeapSnapshotIndices = (
  node_types: readonly any[],
  node_fields: readonly any[],
  edge_types: readonly any[],
  edge_fields: readonly any[]
): HeapSnapshotIndices => {
  // Type indices
  const objectTypeIndex = node_types[0].indexOf('object')
  const nativeTypeIndex = node_types[0].indexOf('native')
  const bigintTypeIndex = node_types[0].indexOf('bigint')
  const regexpTypeIndex = node_types[0].indexOf('regexp')

  // Items per record
  const ITEMS_PER_NODE = node_fields.length
  const ITEMS_PER_EDGE = edge_fields.length

  // Node field indices
  const typeFieldIndex = node_fields.indexOf('type')
  const nameFieldIndex = node_fields.indexOf('name')
  const idFieldIndex = node_fields.indexOf('id')
  const selfSizeFieldIndex = node_fields.indexOf('self_size')
  const edgeCountFieldIndex = node_fields.indexOf('edge_count')
  const detachednessFieldIndex = node_fields.indexOf('detachedness')
  const traceNodeIdFieldIndex = node_fields.indexOf('trace_node_id')

  // Edge field indices
  const edgeTypeFieldIndex = edge_fields.indexOf('type')
  const edgeNameFieldIndex = edge_fields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edge_fields.indexOf('to_node')

  return {
    // Type indices
    objectTypeIndex,
    nativeTypeIndex,
    bigintTypeIndex,
    regexpTypeIndex,

    // Items per record
    ITEMS_PER_NODE,
    ITEMS_PER_EDGE,

    // Node field indices
    typeFieldIndex,
    nameFieldIndex,
    idFieldIndex,
    selfSizeFieldIndex,
    edgeCountFieldIndex,
    detachednessFieldIndex,
    traceNodeIdFieldIndex,

    // Edge field indices
    edgeTypeFieldIndex,
    edgeNameFieldIndex,
    edgeToNodeFieldIndex,

    // Edge type names for reference
    edgeTypes: edge_types[0],
    nodeTypes: node_types[0],
  }
}

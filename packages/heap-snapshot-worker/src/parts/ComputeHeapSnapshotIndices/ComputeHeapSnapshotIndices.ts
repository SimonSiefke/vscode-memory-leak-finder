type NodeTypes = [readonly string[]]
type EdgeTypes = [readonly string[]]

/**
 * @param {readonly any[]} node_types
 * @param {readonly any[]} node_fields
 * @param {readonly any[]} edge_types
 * @param {readonly any[]} edge_fields
 * @returns {Object}
 */
export const computeHeapSnapshotIndices = (node_types: NodeTypes, node_fields: readonly string[], edge_types: EdgeTypes, edge_fields: readonly string[]) => {
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
    bigintTypeIndex,
    detachednessFieldIndex,
    edgeCountFieldIndex,
    edgeNameFieldIndex,

    edgeToNodeFieldIndex,
    // Edge field indices
    edgeTypeFieldIndex,

    // Edge type names for reference
    edgeTypes: edge_types[0],
    idFieldIndex,
    ITEMS_PER_EDGE,
    // Items per record
    ITEMS_PER_NODE,
    nameFieldIndex,
    nativeTypeIndex,
    nodeTypes: node_types[0],

    // Type indices
    objectTypeIndex,
    regexpTypeIndex,
    selfSizeFieldIndex,

    traceNodeIdFieldIndex,
    // Node field indices
    typeFieldIndex,
  }
}

/**
 * @param {Array} node_types
 * @param {Array} node_fields
 * @param {Array} edge_types
 * @param {Array} edge_fields
 * @returns {Object}
 */
export const computeHeapSnapshotIndices = (node_types, node_fields, edge_types, edge_fields) => {
  // Type indices
  const objectTypeIndex = node_types[0].indexOf('object')
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

  // Edge field indices
  const edgeTypeFieldIndex = edge_fields.indexOf('type')
  const edgeNameFieldIndex = edge_fields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edge_fields.indexOf('to_node')

  return {
    // Type indices
    objectTypeIndex,
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

    // Edge field indices
    edgeTypeFieldIndex,
    edgeNameFieldIndex,
    edgeToNodeFieldIndex,

    // Edge type names for reference
    edgeTypes: edge_types[0],
    nodeTypes: node_types[0],
  }
}

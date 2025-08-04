/**
 * @param {Array} strings
 * @param {Uint32Array} nodes
 * @param {Array} node_types
 * @param {Array} node_fields
 * @param {Uint32Array} edges
 * @param {Array} edge_types
 * @param {Array} edge_fields
 * @returns {Array}
 */
export const getBigintObjectsFromHeapSnapshotInternal = (strings, nodes, node_types, node_fields, edges, edge_types, edge_fields) => {
  const bigintTypeIndex = node_types[0].indexOf('bigint')
  const ITEMS_PER_NODE = node_fields.length
  const ITEMS_PER_EDGE = edge_fields.length

  // Calculate field indices once
  const typeFieldIndex = node_fields.indexOf('type')
  const nameFieldIndex = node_fields.indexOf('name')
  const idFieldIndex = node_fields.indexOf('id')
  const selfSizeFieldIndex = node_fields.indexOf('self_size')
  const edgeCountFieldIndex = node_fields.indexOf('edge_count')
  const detachednessFieldIndex = node_fields.indexOf('detachedness')

  const edgeTypeFieldIndex = edge_fields.indexOf('type')
  const edgeNameFieldIndex = edge_fields.indexOf('name_or_index')
  const edgeToNodeFieldIndex = edge_fields.indexOf('to_node')

  if (bigintTypeIndex === -1) {
    return []
  }

  // First pass: collect bigint objects
  const bigintObjects = []
  const bigintNodeMap = new Map() // nodeDataIndex -> bigint object

  for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
    const typeIndex = nodes[i + typeFieldIndex]
    if (typeIndex === bigintTypeIndex) {
      const nameIndex = nodes[i + nameFieldIndex]
      const id = nodes[i + idFieldIndex]
      const name = strings[nameIndex] || ''
      const selfSize = nodes[i + selfSizeFieldIndex]
      const edgeCount = nodes[i + edgeCountFieldIndex]
      const detachedness = nodes[i + detachednessFieldIndex]

      const bigintObj = {
        id,
        name,
        value: name, // This will be "bigint" - the type identifier
        selfSize,
        edgeCount,
        detachedness,
        variableNames: [], // Will be populated by scanning edges
        note: 'Actual bigint numeric value not accessible via heap snapshot format',
      }

      bigintObjects.push(bigintObj)
      bigintNodeMap.set(i, bigintObj) // Map nodeDataIndex to object
    }
  }

  // Second pass: find variable names by scanning edges that reference bigint objects
  let currentEdgeOffset = 0

  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += ITEMS_PER_NODE) {
    const edgeCount = nodes[nodeIndex + edgeCountFieldIndex]

    // Scan this node's edges
    for (let j = 0; j < edgeCount; j++) {
      const edgeIndex = (currentEdgeOffset + j) * ITEMS_PER_EDGE
      const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]

      // Check if this edge points to a bigint object
      const bigintObj = bigintNodeMap.get(edgeToNode)
      if (bigintObj) {
        const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
        const edgeNameOrIndex = edges[edgeIndex + edgeNameFieldIndex]
        const edgeTypeName = edge_types[0][edgeType] || `type_${edgeType}`

        let edgeName = ''
        if (edgeTypeName === 'element') {
          edgeName = `[${edgeNameOrIndex}]`
        } else {
          edgeName = strings[edgeNameOrIndex] || `<string_${edgeNameOrIndex}>`
        }

        // Get source node info
        const sourceTypeIndex = nodes[nodeIndex + typeFieldIndex]
        const sourceNameIndex = nodes[nodeIndex + nameFieldIndex]
        const sourceTypeName = node_types[0][sourceTypeIndex] || `type_${sourceTypeIndex}`
        const sourceName = strings[sourceNameIndex] || `<string_${sourceNameIndex}>`

        // Collect variable names from property edges
        if (edgeTypeName === 'property' && edgeName !== 'constructor' && edgeName !== '__proto__') {
          bigintObj.variableNames.push({
            name: edgeName,
            sourceType: sourceTypeName,
            sourceName: sourceName,
          })
        }
      }
    }

    currentEdgeOffset += edgeCount
  }

  // Filter out embedded constants (bigints without variable names) and sort by id
  const namedBigintObjects = bigintObjects.filter((obj) => obj.variableNames.length > 0)
  return namedBigintObjects.sort((a, b) => a.id - b.id)
}

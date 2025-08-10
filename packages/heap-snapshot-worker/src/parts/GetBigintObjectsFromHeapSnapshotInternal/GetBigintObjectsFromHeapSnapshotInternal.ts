import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.js'

interface BigintObject {
  id: number
  name: string
  value: string
  selfSize: number
  edgeCount: number
  detachedness: number
  variableNames: VariableName[]
  note: string
}

interface VariableName {
  name: string
  sourceType: string
  sourceName: string
}

/**
 * @param {import('../Snapshot/Snapshot.ts').Snapshot} snapshot
 * @returns {Array}
 */
export const getBigintObjectsFromHeapSnapshotInternal = (snapshot: any): BigintObject[] => {
  const { nodes, strings, edges, meta } = snapshot
  const { node_types, node_fields, edge_types, edge_fields } = meta
  const {
    bigintTypeIndex,
    ITEMS_PER_NODE,
    ITEMS_PER_EDGE,
    typeFieldIndex,
    nameFieldIndex,
    idFieldIndex,
    selfSizeFieldIndex,
    edgeCountFieldIndex,
    detachednessFieldIndex,
    edgeTypeFieldIndex,
    edgeNameFieldIndex,
    edgeToNodeFieldIndex,
    edgeTypes,
    nodeTypes,
  } = computeHeapSnapshotIndices(node_types, node_fields, edge_types, edge_fields)

  if (bigintTypeIndex === -1) {
    return []
  }

  // First pass: collect bigint objects
  const bigintObjects: BigintObject[] = []
  const bigintNodeMap = new Map<number, BigintObject>() // nodeDataIndex -> bigint object

  for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
    const typeIndex = nodes[i + typeFieldIndex]
    if (typeIndex === bigintTypeIndex) {
      const nameIndex = nodes[i + nameFieldIndex]
      const id = nodes[i + idFieldIndex]
      const name = strings[nameIndex] || ''
      const selfSize = nodes[i + selfSizeFieldIndex]
      const edgeCount = nodes[i + edgeCountFieldIndex]
      const detachedness = nodes[i + detachednessFieldIndex]

      const bigintObj: BigintObject = {
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
        const edgeTypeName = edgeTypes[edgeType] || `type_${edgeType}`

        let edgeName = ''
        if (edgeTypeName === 'element') {
          edgeName = `[${edgeNameOrIndex}]`
        } else {
          edgeName = strings[edgeNameOrIndex] || `<string_${edgeNameOrIndex}>`
        }

        // Get source node info
        const sourceTypeIndex = nodes[nodeIndex + typeFieldIndex]
        const sourceNameIndex = nodes[nodeIndex + nameFieldIndex]
        const sourceTypeName = nodeTypes[sourceTypeIndex] || `type_${sourceTypeIndex}`
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

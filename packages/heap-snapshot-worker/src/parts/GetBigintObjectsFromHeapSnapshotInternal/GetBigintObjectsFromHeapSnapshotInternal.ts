import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

/**
 * @param {Snapshot} snapshot
 * @returns {readonly BigintObject[]}
 */
export interface VariableName {
  readonly name: string
  readonly sourceName: string
  readonly sourceType: string
}
export interface BigintObject {
  readonly detachedness: number
  readonly edgeCount: number
  readonly id: number
  readonly name: string
  readonly note: string
  readonly selfSize: number
  readonly value: string
  variableNames: VariableName[]
}

export const getBigintObjectsFromHeapSnapshotInternal = (snapshot: Snapshot): readonly BigintObject[] => {
  const { edges, meta, nodes, strings } = snapshot
  const { edge_fields, edge_types, node_fields, node_types } = meta
  const {
    bigintTypeIndex,
    detachednessFieldIndex,
    edgeCountFieldIndex,
    edgeNameFieldIndex,
    edgeToNodeFieldIndex,
    edgeTypeFieldIndex,
    edgeTypes,
    idFieldIndex,
    ITEMS_PER_EDGE,
    ITEMS_PER_NODE,
    nameFieldIndex,
    nodeTypes,
    selfSizeFieldIndex,
    typeFieldIndex,
  } = computeHeapSnapshotIndices(node_types, node_fields, edge_types, edge_fields)

  if (bigintTypeIndex === -1) {
    return []
  }

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
        detachedness,
        edgeCount,
        id,
        name,
        note: 'Actual bigint numeric value not accessible via heap snapshot format',
        selfSize,
        value: name, // This will be "bigint" - the type identifier
        variableNames: [], // Will be populated by scanning edges
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
            sourceName: sourceName,
            sourceType: sourceTypeName,
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

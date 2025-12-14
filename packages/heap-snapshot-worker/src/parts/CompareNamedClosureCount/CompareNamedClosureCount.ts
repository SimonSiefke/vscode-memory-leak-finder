import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.ts'
import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import * as IgnoredHeapSnapshotEdges from '../IgnoredHeapSnapshotEdges/IgnoredHeapSnapshotEdges.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

const ignoredSet = new Set(IgnoredHeapSnapshotEdges.ignoredHeapSnapshotEdges)

const isImportantEdge = (edgeName: string): boolean => {
  return !ignoredSet.has(edgeName)
}

const getName = (closureNameIndex: number, strings: readonly string[], contextNodeEdges: Array<{ targetNodeName: string }>): string => {
  if (closureNameIndex >= 0 && strings[closureNameIndex]) {
    return strings[closureNameIndex]
  }
  return contextNodeEdges
    .map((edge) => edge.targetNodeName)
    .join(':')
    .slice(0, 100)
}

interface ClosureInfo {
  readonly name: string
  readonly contextNodeCount: number
  readonly id: number
  readonly nodeIndex: number
}

const getClosureCounts = (nodes: Uint32Array, edges: Uint32Array, strings: readonly string[], meta: any): Map<string, number> => {
  if (!meta || !meta.node_types || !meta.edge_types) {
    console.log('getClosureCounts - Invalid meta:', meta)
    return new Map()
  }
  const { node_types, node_fields, edge_types, edge_fields } = meta
  const {
    ITEMS_PER_NODE,
    ITEMS_PER_EDGE,
    typeFieldIndex,
    nameFieldIndex,
    edgeCountFieldIndex,
    edgeNameFieldIndex,
    edgeToNodeFieldIndex,
    nodeTypes,
    edgeTypes,
  } = computeHeapSnapshotIndices(node_types, node_fields, edge_types, edge_fields)

  const closureTypeIndex = nodeTypes.indexOf('closure')
  const contextEdgeTypeIndex = edgeTypes.indexOf('context')

  if (closureTypeIndex === -1 || contextEdgeTypeIndex === -1) {
    return new Map()
  }

  const edgeMap = createEdgeMap(nodes, node_fields)
  const nameToTotalCountMap = new Map<string, number>()

  // Iterate through all nodes to find closures
  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += ITEMS_PER_NODE) {
    const typeIndex = nodes[nodeIndex + typeFieldIndex]
    if (typeIndex !== closureTypeIndex) {
      continue
    }

    const closureNameIndex = nodes[nodeIndex + nameFieldIndex]
    const edgeCount = nodes[nodeIndex + edgeCountFieldIndex]
    const logicalNodeIndex = nodeIndex / ITEMS_PER_NODE
    const edgeStartIndex = edgeMap[logicalNodeIndex]

    // Find context edge - check edge name, not type!
    let contextNodeByteOffset = -1
    const contextStringIndex = strings.indexOf('context')
    for (let i = 0; i < edgeCount; i++) {
      const edgeIndex = (edgeStartIndex + i) * ITEMS_PER_EDGE
      const edgeNameIndex = edges[edgeIndex + edgeNameFieldIndex]
      const edgeName = strings[edgeNameIndex] || ''
      // Check if this is a context edge by name (not type)
      if (edgeName === 'context' || (contextStringIndex >= 0 && edgeNameIndex === contextStringIndex)) {
        contextNodeByteOffset = edges[edgeIndex + edgeToNodeFieldIndex]
        break
      }
    }

    if (contextNodeByteOffset === -1) {
      continue
    }

    // Convert byte offset to node index
    const contextNodeIndex = Math.floor(contextNodeByteOffset / ITEMS_PER_NODE)

    // Count important edges from context node
    const contextNodeOffset = contextNodeIndex * ITEMS_PER_NODE
    const contextEdgeCount = nodes[contextNodeOffset + edgeCountFieldIndex]
    const contextEdgeStartIndex = edgeMap[contextNodeIndex]

    const contextNodeEdges: Array<{ targetNodeName: string }> = []
    for (let i = 0; i < contextEdgeCount; i++) {
      const edgeIndex = (contextEdgeStartIndex + i) * ITEMS_PER_EDGE
      const edgeNameIndex = edges[edgeIndex + edgeNameFieldIndex]
      const edgeName = strings[edgeNameIndex] || ''
      if (isImportantEdge(edgeName)) {
        // Get target node name
        const targetNodeByteOffset = edges[edgeIndex + edgeToNodeFieldIndex]
        const targetNodeIndex = Math.floor(targetNodeByteOffset / ITEMS_PER_NODE)
        const targetNodeOffset = targetNodeIndex * ITEMS_PER_NODE
        const targetNodeNameIndex = nodes[targetNodeOffset + nameFieldIndex]
        const targetNodeName = strings[targetNodeNameIndex] || ''
        contextNodeEdges.push({ targetNodeName })
      }
    }

    const contextNodeCount = contextNodeEdges.length
    const name = getName(closureNameIndex, strings, contextNodeEdges)

    const currentTotal = nameToTotalCountMap.get(name) || 0
    nameToTotalCountMap.set(name, currentTotal + contextNodeCount)
  }

  return nameToTotalCountMap
}

const getClosureInfos = (nodes: Uint32Array, edges: Uint32Array, strings: readonly string[], meta: any): Map<string, ClosureInfo> => {
  const { node_types, node_fields, edge_types, edge_fields } = meta
  const {
    ITEMS_PER_NODE,
    ITEMS_PER_EDGE,
    typeFieldIndex,
    nameFieldIndex,
    idFieldIndex,
    edgeCountFieldIndex,
    edgeNameFieldIndex,
    edgeToNodeFieldIndex,
    nodeTypes,
    edgeTypes,
  } = computeHeapSnapshotIndices(node_types, node_fields, edge_types, edge_fields)

  const closureTypeIndex = nodeTypes.indexOf('closure')
  const contextEdgeTypeIndex = edgeTypes.indexOf('context')

  if (closureTypeIndex === -1 || contextEdgeTypeIndex === -1) {
    return new Map()
  }

  const edgeMap = createEdgeMap(nodes, node_fields)
  const nameToClosureInfoMap = new Map<string, ClosureInfo>()

  // Iterate through all nodes to find closures
  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += ITEMS_PER_NODE) {
    const typeIndex = nodes[nodeIndex + typeFieldIndex]
    if (typeIndex !== closureTypeIndex) {
      continue
    }

    const closureId = nodes[nodeIndex + idFieldIndex]
    const closureNameIndex = nodes[nodeIndex + nameFieldIndex]
    const edgeCount = nodes[nodeIndex + edgeCountFieldIndex]
    const logicalNodeIndex = nodeIndex / ITEMS_PER_NODE
    const edgeStartIndex = edgeMap[logicalNodeIndex]

    // Find context edge - check edge name, not type!
    let contextNodeByteOffset = -1
    const contextStringIndex = strings.indexOf('context')
    for (let i = 0; i < edgeCount; i++) {
      const edgeIndex = (edgeStartIndex + i) * ITEMS_PER_EDGE
      const edgeNameIndex = edges[edgeIndex + edgeNameFieldIndex]
      const edgeName = strings[edgeNameIndex] || ''
      // Check if this is a context edge by name (not type)
      if (edgeName === 'context' || (contextStringIndex >= 0 && edgeNameIndex === contextStringIndex)) {
        contextNodeByteOffset = edges[edgeIndex + edgeToNodeFieldIndex]
        break
      }
    }

    if (contextNodeByteOffset === -1) {
      continue
    }

    // Convert byte offset to node index
    const contextNodeIndex = Math.floor(contextNodeByteOffset / ITEMS_PER_NODE)

    // Count important edges from context node
    const contextNodeOffset = contextNodeIndex * ITEMS_PER_NODE
    const contextEdgeCount = nodes[contextNodeOffset + edgeCountFieldIndex]
    const contextEdgeStartIndex = edgeMap[contextNodeIndex]

    const contextNodeEdges: Array<{ targetNodeName: string }> = []
    for (let i = 0; i < contextEdgeCount; i++) {
      const edgeIndex = (contextEdgeStartIndex + i) * ITEMS_PER_EDGE
      const edgeNameIndex = edges[edgeIndex + edgeNameFieldIndex]
      const edgeName = strings[edgeNameIndex] || ''
      if (isImportantEdge(edgeName)) {
        // Get target node name
        const targetNodeByteOffset = edges[edgeIndex + edgeToNodeFieldIndex]
        const targetNodeIndex = Math.floor(targetNodeByteOffset / ITEMS_PER_NODE)
        const targetNodeOffset = targetNodeIndex * ITEMS_PER_NODE
        const targetNodeNameIndex = nodes[targetNodeOffset + nameFieldIndex]
        const targetNodeName = strings[targetNodeNameIndex] || ''
        contextNodeEdges.push({ targetNodeName })
      }
    }

    const contextNodeCount = contextNodeEdges.length
    const name = getName(closureNameIndex, strings, contextNodeEdges)

    // Store first closure info for each name
    if (!nameToClosureInfoMap.has(name)) {
      nameToClosureInfoMap.set(name, {
        name,
        contextNodeCount,
        id: closureId,
        nodeIndex: logicalNodeIndex,
      })
    }
  }

  return nameToClosureInfoMap
}

export const compareNamedClosureCountFromHeapSnapshot = async (pathA: string, pathB: string): Promise<any[]> => {
  console.time('parse')
  const [snapshotA, snapshotB] = await Promise.all([
    prepareHeapSnapshot(pathA, {
      parseStrings: true,
    }),
    prepareHeapSnapshot(pathB, {
      parseStrings: true,
    }),
  ])

  // Get closure counts by name for both snapshots
  const countsA = getClosureCounts(snapshotA.nodes, snapshotA.edges, snapshotA.strings, snapshotA.meta)
  const countsB = getClosureCounts(snapshotB.nodes, snapshotB.edges, snapshotB.strings, snapshotB.meta)

  // Get closure infos from snapshot B for leaked closures
  const closureInfosB = getClosureInfos(snapshotB.nodes, snapshotB.edges, snapshotB.strings, snapshotB.meta)

  // Find leaked closures (where count increased)
  const leakedClosures: any[] = []

  for (const [name, countB] of countsB.entries()) {
    const countA = countsA.get(name) || 0
    const delta = countB - countA
    if (delta > 0) {
      const closureInfo = closureInfosB.get(name)
      if (closureInfo) {
        leakedClosures.push({
          id: closureInfo.id,
          name: closureInfo.name,
          contextNodeCount: closureInfo.contextNodeCount,
          delta,
        })
      }
    }
  }

  // Sort by delta descending, then by name
  const sorted = leakedClosures.toSorted((a, b) => {
    return b.delta - a.delta || a.name.localeCompare(b.name)
  })

  return sorted
}

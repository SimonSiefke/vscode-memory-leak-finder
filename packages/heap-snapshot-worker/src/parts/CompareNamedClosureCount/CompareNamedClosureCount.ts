import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.ts'
import { createEdgeMap } from '../CreateEdgeMap/CreateEdgeMap.ts'
import * as IgnoredHeapSnapshotEdges from '../IgnoredHeapSnapshotEdges/IgnoredHeapSnapshotEdges.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

const ignoredSet = new Set(IgnoredHeapSnapshotEdges.ignoredHeapSnapshotEdges)

const isImportantEdge = (edgeName: string): boolean => {
  return !ignoredSet.has(edgeName)
}

const getName = (
  closureNameIndex: number,
  strings: string[],
  contextNodeEdges: Array<{ nameIndex: number; edgeName: string }>,
): string => {
  if (closureNameIndex >= 0 && strings[closureNameIndex]) {
    return strings[closureNameIndex]
  }
  return contextNodeEdges
    .map((edge) => edge.edgeName)
    .join(':')
    .slice(0, 100)
}

interface ClosureInfo {
  name: string
  contextNodeCount: number
  id: number
  nodeIndex: number
}

const getClosureCounts = (
  nodes: Uint32Array,
  edges: Uint32Array,
  strings: string[],
  meta: any,
): Map<string, number> => {
  const { node_types, node_fields, edge_types, edge_fields } = meta
  const {
    ITEMS_PER_NODE,
    ITEMS_PER_EDGE,
    typeFieldIndex,
    nameFieldIndex,
    idFieldIndex,
    edgeCountFieldIndex,
    edgeTypeFieldIndex,
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

    const closureId = nodes[nodeIndex + idFieldIndex]
    const closureNameIndex = nodes[nodeIndex + nameFieldIndex]
    const edgeCount = nodes[nodeIndex + edgeCountFieldIndex]
    const logicalNodeIndex = nodeIndex / ITEMS_PER_NODE
    const edgeStartIndex = edgeMap[logicalNodeIndex]

    // Find context edge
    let contextNodeByteOffset = -1
    for (let i = 0; i < edgeCount; i++) {
      const edgeIndex = (edgeStartIndex + i) * ITEMS_PER_EDGE
      const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
      if (edgeType === contextEdgeTypeIndex) {
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

    const contextNodeEdges: Array<{ nameIndex: number; edgeName: string }> = []
    for (let i = 0; i < contextEdgeCount; i++) {
      const edgeIndex = (contextEdgeStartIndex + i) * ITEMS_PER_EDGE
      const edgeNameIndex = edges[edgeIndex + edgeNameFieldIndex]
      const edgeName = strings[edgeNameIndex] || ''
      if (isImportantEdge(edgeName)) {
        contextNodeEdges.push({ nameIndex: edgeNameIndex, edgeName })
      }
    }

    const contextNodeCount = contextNodeEdges.length
    const name = getName(closureNameIndex, strings, contextNodeEdges)

    const currentTotal = nameToTotalCountMap.get(name) || 0
    nameToTotalCountMap.set(name, currentTotal + contextNodeCount)
  }

  return nameToTotalCountMap
}

const getClosureInfos = (
  nodes: Uint32Array,
  edges: Uint32Array,
  strings: string[],
  meta: any,
): Map<string, ClosureInfo> => {
  const { node_types, node_fields, edge_types, edge_fields } = meta
  const {
    ITEMS_PER_NODE,
    ITEMS_PER_EDGE,
    typeFieldIndex,
    nameFieldIndex,
    idFieldIndex,
    edgeCountFieldIndex,
    edgeTypeFieldIndex,
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

    // Find context edge
    let contextNodeByteOffset = -1
    for (let i = 0; i < edgeCount; i++) {
      const edgeIndex = (edgeStartIndex + i) * ITEMS_PER_EDGE
      const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
      if (edgeType === contextEdgeTypeIndex) {
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

    const contextNodeEdges: Array<{ nameIndex: number; edgeName: string }> = []
    for (let i = 0; i < contextEdgeCount; i++) {
      const edgeIndex = (contextEdgeStartIndex + i) * ITEMS_PER_EDGE
      const edgeNameIndex = edges[edgeIndex + edgeNameFieldIndex]
      const edgeName = strings[edgeNameIndex] || ''
      if (isImportantEdge(edgeName)) {
        contextNodeEdges.push({ nameIndex: edgeNameIndex, edgeName })
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

export const compareNamedClosureCountFromHeapSnapshot = async (
  pathA: string,
  pathB: string,
): Promise<any[]> => {
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

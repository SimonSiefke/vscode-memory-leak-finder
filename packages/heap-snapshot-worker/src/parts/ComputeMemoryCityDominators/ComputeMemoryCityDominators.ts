import type { Snapshot } from '../Snapshot/Snapshot.ts'

export interface MemoryCityDominatorResult {
  readonly dominators: Uint32Array
  readonly postOrder: Uint32Array
  readonly retainedSizes: Float64Array
}

const buildFirstEdgeIndexes = (
  snapshot: Snapshot,
  edgeCountOffset: number,
  nodeFieldCount: number,
  edgeFieldCount: number,
): Uint32Array => {
  const firstEdgeIndexes = new Uint32Array(snapshot.node_count + 1)
  let edgeIndex = 0
  for (let ordinal = 0; ordinal < snapshot.node_count; ordinal++) {
    firstEdgeIndexes[ordinal] = edgeIndex
    edgeIndex += snapshot.nodes[ordinal * nodeFieldCount + edgeCountOffset] * edgeFieldCount
  }
  firstEdgeIndexes[snapshot.node_count] = edgeIndex
  return firstEdgeIndexes
}

const isEssentialEdge = (fromOrdinal: number, rootOrdinal: number, edgeType: number, weakType: number, shortcutType: number): boolean => {
  return edgeType !== weakType && (edgeType !== shortcutType || fromOrdinal === rootOrdinal)
}

const buildPostOrder = (
  snapshot: Snapshot,
  firstEdgeIndexes: Uint32Array,
  edgeFieldCount: number,
  edgeTypeOffset: number,
  edgeToNodeOffset: number,
  nodeFieldCount: number,
  weakType: number,
  shortcutType: number,
  rootOrdinal: number,
): Uint32Array => {
  const visited = new Uint8Array(snapshot.node_count)
  const reachablePostOrder: number[] = []
  const orphanPostOrder: number[] = []

  const visit = (start: number, output: number[]): void => {
    const nodes: number[] = [start]
    const cursors: number[] = [firstEdgeIndexes[start]]
    visited[start] = 1
    while (nodes.length > 0) {
      const stackIndex = nodes.length - 1
      const ordinal = nodes[stackIndex]
      const edgeIndex = cursors[stackIndex]
      if (edgeIndex >= firstEdgeIndexes[ordinal + 1]) {
        output.push(ordinal)
        nodes.pop()
        cursors.pop()
        continue
      }
      cursors[stackIndex] += edgeFieldCount
      const edgeType = snapshot.edges[edgeIndex + edgeTypeOffset]
      if (!isEssentialEdge(ordinal, rootOrdinal, edgeType, weakType, shortcutType)) {
        continue
      }
      const childOrdinal = snapshot.edges[edgeIndex + edgeToNodeOffset] / nodeFieldCount
      if (visited[childOrdinal]) {
        continue
      }
      visited[childOrdinal] = 1
      nodes.push(childOrdinal)
      cursors.push(firstEdgeIndexes[childOrdinal])
    }
  }

  visit(rootOrdinal, reachablePostOrder)
  for (let ordinal = 0; ordinal < snapshot.node_count; ordinal++) {
    if (!visited[ordinal]) {
      visit(ordinal, orphanPostOrder)
    }
  }
  const rootIndex = reachablePostOrder.indexOf(rootOrdinal)
  if (rootIndex !== reachablePostOrder.length - 1) {
    reachablePostOrder.splice(rootIndex, 1)
    reachablePostOrder.push(rootOrdinal)
  }
  return Uint32Array.from([...orphanPostOrder, ...reachablePostOrder])
}

const buildRetainers = (
  snapshot: Snapshot,
  firstEdgeIndexes: Uint32Array,
  edgeFieldCount: number,
  edgeTypeOffset: number,
  edgeToNodeOffset: number,
  nodeFieldCount: number,
  weakType: number,
  shortcutType: number,
  rootOrdinal: number,
): { readonly firstRetainerIndexes: Uint32Array; readonly retainingNodes: Uint32Array } => {
  const counts = new Uint32Array(snapshot.node_count)
  for (let fromOrdinal = 0; fromOrdinal < snapshot.node_count; fromOrdinal++) {
    for (let edgeIndex = firstEdgeIndexes[fromOrdinal]; edgeIndex < firstEdgeIndexes[fromOrdinal + 1]; edgeIndex += edgeFieldCount) {
      const edgeType = snapshot.edges[edgeIndex + edgeTypeOffset]
      if (!isEssentialEdge(fromOrdinal, rootOrdinal, edgeType, weakType, shortcutType)) {
        continue
      }
      const toOrdinal = snapshot.edges[edgeIndex + edgeToNodeOffset] / nodeFieldCount
      counts[toOrdinal]++
    }
  }
  const firstRetainerIndexes = new Uint32Array(snapshot.node_count + 1)
  for (let ordinal = 0; ordinal < snapshot.node_count; ordinal++) {
    firstRetainerIndexes[ordinal + 1] = firstRetainerIndexes[ordinal] + counts[ordinal]
  }
  const retainingNodes = new Uint32Array(firstRetainerIndexes[snapshot.node_count])
  const offsets = firstRetainerIndexes.slice(0, snapshot.node_count)
  for (let fromOrdinal = 0; fromOrdinal < snapshot.node_count; fromOrdinal++) {
    for (let edgeIndex = firstEdgeIndexes[fromOrdinal]; edgeIndex < firstEdgeIndexes[fromOrdinal + 1]; edgeIndex += edgeFieldCount) {
      const edgeType = snapshot.edges[edgeIndex + edgeTypeOffset]
      if (!isEssentialEdge(fromOrdinal, rootOrdinal, edgeType, weakType, shortcutType)) {
        continue
      }
      const toOrdinal = snapshot.edges[edgeIndex + edgeToNodeOffset] / nodeFieldCount
      retainingNodes[offsets[toOrdinal]++] = fromOrdinal
    }
  }
  return { firstRetainerIndexes, retainingNodes }
}

const intersect = (left: number, right: number, idom: Uint32Array, noEntry: number): number => {
  let a = left
  let b = right
  while (a !== b) {
    while (a < b && idom[a] !== noEntry) {
      a = idom[a]
    }
    while (b < a && idom[b] !== noEntry) {
      b = idom[b]
    }
    if (idom[a] === noEntry || idom[b] === noEntry) {
      return noEntry
    }
  }
  return a
}

export const computeMemoryCityDominators = (snapshot: Snapshot): MemoryCityDominatorResult => {
  const { edge_fields: edgeFields, edge_types: edgeTypesList, node_fields: nodeFields } = snapshot.meta
  const nodeFieldCount = nodeFields.length
  const edgeFieldCount = edgeFields.length
  const edgeCountOffset = nodeFields.indexOf('edge_count')
  const selfSizeOffset = nodeFields.indexOf('self_size')
  const edgeTypeOffset = edgeFields.indexOf('type')
  const edgeToNodeOffset = edgeFields.indexOf('to_node')
  const edgeTypes = edgeTypesList[0] || []
  const weakType = edgeTypes.indexOf('weak')
  const shortcutType = edgeTypes.indexOf('shortcut')
  const rootOrdinal = 0
  const firstEdgeIndexes = buildFirstEdgeIndexes(snapshot, edgeCountOffset, nodeFieldCount, edgeFieldCount)
  const postOrder = buildPostOrder(
    snapshot,
    firstEdgeIndexes,
    edgeFieldCount,
    edgeTypeOffset,
    edgeToNodeOffset,
    nodeFieldCount,
    weakType,
    shortcutType,
    rootOrdinal,
  )
  const nodeToPostOrder = new Uint32Array(snapshot.node_count)
  for (let index = 0; index < postOrder.length; index++) {
    nodeToPostOrder[postOrder[index]] = index
  }
  const { firstRetainerIndexes, retainingNodes } = buildRetainers(
    snapshot,
    firstEdgeIndexes,
    edgeFieldCount,
    edgeTypeOffset,
    edgeToNodeOffset,
    nodeFieldCount,
    weakType,
    shortcutType,
    rootOrdinal,
  )
  const rootPostOrder = nodeToPostOrder[rootOrdinal]
  const noEntry = snapshot.node_count
  const idom = new Uint32Array(snapshot.node_count)
  idom.fill(noEntry)
  idom[rootPostOrder] = rootPostOrder

  let changed = true
  while (changed) {
    changed = false
    for (let postIndex = rootPostOrder - 1; postIndex >= 0; postIndex--) {
      const ordinal = postOrder[postIndex]
      let newDominator = noEntry
      for (let index = firstRetainerIndexes[ordinal]; index < firstRetainerIndexes[ordinal + 1]; index++) {
        const predecessorPostIndex = nodeToPostOrder[retainingNodes[index]]
        if (idom[predecessorPostIndex] === noEntry) {
          continue
        }
        newDominator = newDominator === noEntry ? predecessorPostIndex : intersect(predecessorPostIndex, newDominator, idom, noEntry)
      }
      if (newDominator === noEntry) {
        newDominator = rootPostOrder
      }
      if (idom[postIndex] !== newDominator) {
        idom[postIndex] = newDominator
        changed = true
      }
    }
  }

  const dominators = new Uint32Array(snapshot.node_count)
  for (let postIndex = 0; postIndex < postOrder.length; postIndex++) {
    dominators[postOrder[postIndex]] = postOrder[idom[postIndex]]
  }
  dominators[rootOrdinal] = rootOrdinal

  const retainedSizes = new Float64Array(snapshot.node_count)
  for (let ordinal = 0; ordinal < snapshot.node_count; ordinal++) {
    retainedSizes[ordinal] = snapshot.nodes[ordinal * nodeFieldCount + selfSizeOffset]
  }
  for (let postIndex = 0; postIndex < postOrder.length - 1; postIndex++) {
    const ordinal = postOrder[postIndex]
    retainedSizes[dominators[ordinal]] += retainedSizes[ordinal]
  }
  return { dominators, postOrder, retainedSizes }
}

import type { Snapshot } from '../Snapshot/Snapshot.ts'

export interface MemoryCityDominatorResult {
  readonly dominators: Uint32Array
  readonly postOrder: Uint32Array
  readonly retainedSizes: Float64Array
}

interface DfsOrder {
  readonly dfsIndex: Uint32Array
  readonly parent: Uint32Array
  readonly postOrder: Uint32Array
  readonly reachableCount: number
  readonly vertex: Uint32Array
}

const MissingNode = 0xffffffff

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

const buildDfsOrder = (
  snapshot: Snapshot,
  firstEdgeIndexes: Uint32Array,
  edgeFieldCount: number,
  edgeTypeOffset: number,
  edgeToNodeOffset: number,
  nodeFieldCount: number,
  weakType: number,
  shortcutType: number,
  rootOrdinal: number,
): DfsOrder => {
  const dfsIndex = new Uint32Array(snapshot.node_count)
  const parent = new Uint32Array(snapshot.node_count)
  parent.fill(MissingNode)
  const vertex = new Uint32Array(snapshot.node_count + 1)
  if (snapshot.node_count === 0) {
    return { dfsIndex, parent, postOrder: new Uint32Array(), reachableCount: 0, vertex }
  }
  const reachablePostOrder: number[] = []
  const nodes: number[] = [rootOrdinal]
  const cursors: number[] = [firstEdgeIndexes[rootOrdinal]]
  let reachableCount = 1
  dfsIndex[rootOrdinal] = reachableCount
  parent[rootOrdinal] = rootOrdinal
  vertex[reachableCount] = rootOrdinal
  while (nodes.length > 0) {
    const stackIndex = nodes.length - 1
    const ordinal = nodes[stackIndex]
    const edgeIndex = cursors[stackIndex]
    if (edgeIndex >= firstEdgeIndexes[ordinal + 1]) {
      reachablePostOrder.push(ordinal)
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
    if (dfsIndex[childOrdinal] !== 0) {
      continue
    }
    reachableCount++
    dfsIndex[childOrdinal] = reachableCount
    parent[childOrdinal] = ordinal
    vertex[reachableCount] = childOrdinal
    nodes.push(childOrdinal)
    cursors.push(firstEdgeIndexes[childOrdinal])
  }
  const orphanOrdinals: number[] = []
  for (let ordinal = 0; ordinal < snapshot.node_count; ordinal++) {
    if (dfsIndex[ordinal] === 0) {
      orphanOrdinals.push(ordinal)
    }
  }
  return {
    dfsIndex,
    parent,
    postOrder: Uint32Array.from([...orphanOrdinals, ...reachablePostOrder]),
    reachableCount,
    vertex,
  }
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

const evaluate = (start: number, ancestor: Uint32Array, label: Uint32Array, semiDominator: Uint32Array, path: Uint32Array): number => {
  if (ancestor[start] === MissingNode) {
    return label[start]
  }
  let current = start
  let pathLength = 0
  while (ancestor[current] !== MissingNode && ancestor[ancestor[current]] !== MissingNode) {
    path[pathLength++] = current
    current = ancestor[current]
  }
  while (pathLength > 0) {
    const node = path[--pathLength]
    const parent = ancestor[node]
    if (semiDominator[label[parent]] < semiDominator[label[node]]) {
      label[node] = label[parent]
    }
    ancestor[node] = ancestor[parent]
  }
  return label[start]
}

export const computeMemoryCityDominators = (snapshot: Snapshot): MemoryCityDominatorResult => {
  if (snapshot.node_count === 0) {
    return { dominators: new Uint32Array(), postOrder: new Uint32Array(), retainedSizes: new Float64Array() }
  }
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
  const { dfsIndex, parent, postOrder, reachableCount, vertex } = buildDfsOrder(
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
  const ancestor = new Uint32Array(snapshot.node_count)
  ancestor.fill(MissingNode)
  const bucketHead = new Uint32Array(snapshot.node_count)
  bucketHead.fill(MissingNode)
  const bucketNext = new Uint32Array(snapshot.node_count)
  bucketNext.fill(MissingNode)
  const dominators = new Uint32Array(snapshot.node_count)
  dominators.fill(rootOrdinal)
  const label = new Uint32Array(snapshot.node_count)
  const semiDominator = new Uint32Array(snapshot.node_count)
  for (let index = 1; index <= reachableCount; index++) {
    const ordinal = vertex[index]
    label[ordinal] = ordinal
    semiDominator[ordinal] = index
  }
  const path = new Uint32Array(snapshot.node_count)
  for (let index = reachableCount; index >= 2; index--) {
    const ordinal = vertex[index]
    for (let retainerIndex = firstRetainerIndexes[ordinal]; retainerIndex < firstRetainerIndexes[ordinal + 1]; retainerIndex++) {
      const predecessor = retainingNodes[retainerIndex]
      if (dfsIndex[predecessor] === 0) {
        continue
      }
      const candidate = evaluate(predecessor, ancestor, label, semiDominator, path)
      if (semiDominator[candidate] < semiDominator[ordinal]) {
        semiDominator[ordinal] = semiDominator[candidate]
      }
    }
    const semiDominatorOrdinal = vertex[semiDominator[ordinal]]
    bucketNext[ordinal] = bucketHead[semiDominatorOrdinal]
    bucketHead[semiDominatorOrdinal] = ordinal
    const parentOrdinal = parent[ordinal]
    ancestor[ordinal] = parentOrdinal
    let bucketEntry = bucketHead[parentOrdinal]
    while (bucketEntry !== MissingNode) {
      const next = bucketNext[bucketEntry]
      const candidate = evaluate(bucketEntry, ancestor, label, semiDominator, path)
      dominators[bucketEntry] = semiDominator[candidate] < semiDominator[bucketEntry] ? candidate : parentOrdinal
      bucketEntry = next
    }
    bucketHead[parentOrdinal] = MissingNode
  }
  for (let index = 2; index <= reachableCount; index++) {
    const ordinal = vertex[index]
    if (dominators[ordinal] !== vertex[semiDominator[ordinal]]) {
      dominators[ordinal] = dominators[dominators[ordinal]]
    }
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

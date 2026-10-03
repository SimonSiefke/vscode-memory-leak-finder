import type { Snapshot } from '../Snapshot/Snapshot.ts'

const MissingNode = 0xffffffff
const ignoredNodeTypes = new Set(['bigint', 'code', 'hidden', 'number', 'string', 'synthetic'])
const collectionPattern = /array|context|emitter|listener|map|set/i
const servicePattern = /service/i

interface SourceLocation {
  readonly column: number
  readonly line: number
  readonly scriptId?: number
  readonly source: string
}

interface StackFrame {
  readonly functionName: string
  readonly generated?: SourceLocation
  readonly original?: SourceLocation
}

interface PathSegment {
  readonly edgeType: string
  readonly property: string
  readonly sourceName: string
  readonly sourceType: string
  readonly targetName: string
}

interface Evidence {
  readonly allocationStack: readonly StackFrame[]
  readonly leakedObject: string
  readonly leakedObjectStack: readonly StackFrame[]
  readonly path: readonly PathSegment[]
  readonly retainingLocation?: SourceLocation
  readonly retainingProperty: string
}

interface RiverNode {
  readonly id: string
  readonly inferred?: boolean
  readonly kind: string
  readonly label: string
  readonly objectCount: number
  readonly retainedBytes: number
  readonly stage: 'root' | 'service' | 'retainer' | 'leak'
}

interface RiverLink {
  readonly evidence: readonly Evidence[]
  readonly flowId: string
  readonly id: string
  readonly objectCount: number
  readonly retainedBytes: number
  readonly source: string
  readonly target: string
}

export interface RetainerRiverAnalysis {
  readonly generatedAt: string
  readonly isLeak: boolean
  readonly links: readonly RiverLink[]
  readonly metadata: {
    readonly processType: string
    readonly runs: number
    readonly testName: string
  }
  readonly nodes: readonly RiverNode[]
  readonly schemaVersion: 1
  readonly summary: {
    readonly leakedObjects: number
    readonly retainedBytes: number
    readonly retainingPaths: number
  }
}

interface Graph {
  readonly idom: Int32Array
  readonly incomingOffsets: Uint32Array
  readonly incomingSources: Uint32Array
  readonly outgoingEdgeIndices: Uint32Array
  readonly outgoingOffsets: Uint32Array
  readonly outgoingTargets: Uint32Array
  readonly parent: Uint32Array
  readonly parentEdge: Uint32Array
  readonly reachable: Uint8Array
  readonly retainedSizes: Float64Array
  readonly rpo: readonly number[]
}

interface NodeAccess {
  readonly edgeCountOffset: number
  readonly idOffset: number
  readonly itemsPerNode: number
  readonly nameOffset: number
  readonly selfSizeOffset: number
  readonly traceNodeIdOffset: number
  readonly typeOffset: number
}

interface EdgeAccess {
  readonly itemsPerEdge: number
  readonly nameOffset: number
  readonly targetOffset: number
  readonly typeOffset: number
  readonly typeNames: readonly string[]
  readonly weakType: number
}

const getNodeAccess = (snapshot: Snapshot): NodeAccess => {
  const fields = snapshot.meta.node_fields
  return {
    edgeCountOffset: fields.indexOf('edge_count'),
    idOffset: fields.indexOf('id'),
    itemsPerNode: fields.length,
    nameOffset: fields.indexOf('name'),
    selfSizeOffset: fields.indexOf('self_size'),
    traceNodeIdOffset: fields.indexOf('trace_node_id'),
    typeOffset: fields.indexOf('type'),
  }
}

const getEdgeAccess = (snapshot: Snapshot): EdgeAccess => {
  const fields = snapshot.meta.edge_fields
  const typeNames = snapshot.meta.edge_types[0] || []
  return {
    itemsPerEdge: fields.length,
    nameOffset: fields.indexOf('name_or_index'),
    targetOffset: fields.indexOf('to_node'),
    typeNames,
    typeOffset: fields.indexOf('type'),
    weakType: typeNames.indexOf('weak'),
  }
}

const getNodeName = (snapshot: Snapshot, access: NodeAccess, nodeIndex: number): string => {
  const value = snapshot.nodes[nodeIndex * access.itemsPerNode + access.nameOffset]
  if (nodeIndex === 0 && !snapshot.strings[value]) {
    return '(GC roots)'
  }
  return snapshot.strings[value] || '(anonymous)'
}

const getNodeType = (snapshot: Snapshot, access: NodeAccess, nodeIndex: number): string => {
  const typeIndex = snapshot.nodes[nodeIndex * access.itemsPerNode + access.typeOffset]
  return snapshot.meta.node_types[0]?.[typeIndex] || 'unknown'
}

const getStrongEdgeCount = (snapshot: Snapshot, nodeAccess: NodeAccess, edgeAccess: EdgeAccess): number => {
  let strongEdgeCount = 0
  let edgeOffset = 0
  const nodeCount = snapshot.nodes.length / nodeAccess.itemsPerNode
  for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex++) {
    const edgeCount = snapshot.nodes[nodeIndex * nodeAccess.itemsPerNode + nodeAccess.edgeCountOffset]
    for (let index = 0; index < edgeCount; index++) {
      const edgeItemOffset = (edgeOffset + index) * edgeAccess.itemsPerEdge
      if (snapshot.edges[edgeItemOffset + edgeAccess.typeOffset] !== edgeAccess.weakType) {
        strongEdgeCount++
      }
    }
    edgeOffset += edgeCount
  }
  return strongEdgeCount
}

const buildOutgoingGraph = (
  snapshot: Snapshot,
  nodeAccess: NodeAccess,
  edgeAccess: EdgeAccess,
): {
  readonly outgoingEdgeIndices: Uint32Array
  readonly outgoingOffsets: Uint32Array
  readonly outgoingTargets: Uint32Array
} => {
  const nodeCount = snapshot.nodes.length / nodeAccess.itemsPerNode
  const strongEdgeCount = getStrongEdgeCount(snapshot, nodeAccess, edgeAccess)
  const outgoingOffsets = new Uint32Array(nodeCount + 1)
  const outgoingTargets = new Uint32Array(strongEdgeCount)
  const outgoingEdgeIndices = new Uint32Array(strongEdgeCount)
  let edgeOffset = 0
  let strongEdgeOffset = 0
  for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex++) {
    outgoingOffsets[nodeIndex] = strongEdgeOffset
    const edgeCount = snapshot.nodes[nodeIndex * nodeAccess.itemsPerNode + nodeAccess.edgeCountOffset]
    for (let index = 0; index < edgeCount; index++) {
      const edgeIndex = edgeOffset + index
      const edgeItemOffset = edgeIndex * edgeAccess.itemsPerEdge
      if (snapshot.edges[edgeItemOffset + edgeAccess.typeOffset] === edgeAccess.weakType) {
        continue
      }
      outgoingTargets[strongEdgeOffset] = snapshot.edges[edgeItemOffset + edgeAccess.targetOffset] / nodeAccess.itemsPerNode
      outgoingEdgeIndices[strongEdgeOffset] = edgeIndex
      strongEdgeOffset++
    }
    edgeOffset += edgeCount
  }
  outgoingOffsets[nodeCount] = strongEdgeOffset
  return {
    outgoingEdgeIndices,
    outgoingOffsets,
    outgoingTargets,
  }
}

const getReachable = (
  outgoingOffsets: Uint32Array,
  outgoingTargets: Uint32Array,
): {
  readonly parent: Uint32Array
  readonly parentEdgeOffset: Uint32Array
  readonly reachable: Uint8Array
} => {
  const nodeCount = outgoingOffsets.length - 1
  const reachable = new Uint8Array(nodeCount)
  const parent = new Uint32Array(nodeCount)
  const parentEdgeOffset = new Uint32Array(nodeCount)
  parent.fill(MissingNode)
  parentEdgeOffset.fill(MissingNode)
  if (nodeCount === 0) {
    return { parent, parentEdgeOffset, reachable }
  }
  const queue = new Uint32Array(nodeCount)
  let readIndex = 0
  let writeIndex = 1
  queue[0] = 0
  parent[0] = 0
  reachable[0] = 1
  while (readIndex < writeIndex) {
    const source = queue[readIndex++]
    for (let edgeOffset = outgoingOffsets[source]; edgeOffset < outgoingOffsets[source + 1]; edgeOffset++) {
      const target = outgoingTargets[edgeOffset]
      if (reachable[target]) {
        continue
      }
      reachable[target] = 1
      parent[target] = source
      parentEdgeOffset[target] = edgeOffset
      queue[writeIndex++] = target
    }
  }
  return { parent, parentEdgeOffset, reachable }
}

const buildIncomingGraph = (
  outgoingOffsets: Uint32Array,
  outgoingTargets: Uint32Array,
): {
  readonly incomingOffsets: Uint32Array
  readonly incomingSources: Uint32Array
} => {
  const nodeCount = outgoingOffsets.length - 1
  const counts = new Uint32Array(nodeCount)
  for (const target of outgoingTargets) {
    counts[target]++
  }
  const incomingOffsets = new Uint32Array(nodeCount + 1)
  for (let index = 0; index < nodeCount; index++) {
    incomingOffsets[index + 1] = incomingOffsets[index] + counts[index]
  }
  const incomingSources = new Uint32Array(outgoingTargets.length)
  const cursors = incomingOffsets.slice(0, nodeCount)
  for (let source = 0; source < nodeCount; source++) {
    for (let edgeOffset = outgoingOffsets[source]; edgeOffset < outgoingOffsets[source + 1]; edgeOffset++) {
      const target = outgoingTargets[edgeOffset]
      incomingSources[cursors[target]++] = source
    }
  }
  return { incomingOffsets, incomingSources }
}

const getReversePostOrder = (outgoingOffsets: Uint32Array, outgoingTargets: Uint32Array, reachable: Uint8Array): readonly number[] => {
  if (reachable.length === 0 || !reachable[0]) {
    return []
  }
  const visited = new Uint8Array(reachable.length)
  const nodeStack: number[] = [0]
  const edgeStack: number[] = [outgoingOffsets[0]]
  const postOrder: number[] = []
  visited[0] = 1
  while (nodeStack.length > 0) {
    const stackIndex = nodeStack.length - 1
    const node = nodeStack[stackIndex]
    const edgeOffset = edgeStack[stackIndex]
    if (edgeOffset < outgoingOffsets[node + 1]) {
      edgeStack[stackIndex] = edgeOffset + 1
      const target = outgoingTargets[edgeOffset]
      if (!visited[target]) {
        visited[target] = 1
        nodeStack.push(target)
        edgeStack.push(outgoingOffsets[target])
      }
    } else {
      postOrder.push(node)
      nodeStack.pop()
      edgeStack.pop()
    }
  }
  return postOrder.reverse()
}

const intersectDominators = (first: number, second: number, idom: Int32Array, rpoIndex: Int32Array): number => {
  let left = first
  let right = second
  while (left !== right) {
    while (rpoIndex[left] > rpoIndex[right]) {
      left = idom[left]
    }
    while (rpoIndex[right] > rpoIndex[left]) {
      right = idom[right]
    }
  }
  return left
}

const computeDominators = (
  incomingOffsets: Uint32Array,
  incomingSources: Uint32Array,
  reachable: Uint8Array,
  rpo: readonly number[],
): Int32Array => {
  const idom = new Int32Array(reachable.length)
  idom.fill(-1)
  if (rpo.length === 0) {
    return idom
  }
  const rpoIndex = new Int32Array(reachable.length)
  rpoIndex.fill(-1)
  for (let index = 0; index < rpo.length; index++) {
    rpoIndex[rpo[index]] = index
  }
  idom[0] = 0
  let changed = true
  while (changed) {
    changed = false
    for (let index = 1; index < rpo.length; index++) {
      const node = rpo[index]
      let newDominator = -1
      for (let offset = incomingOffsets[node]; offset < incomingOffsets[node + 1]; offset++) {
        const predecessor = incomingSources[offset]
        if (idom[predecessor] === -1) {
          continue
        }
        newDominator = newDominator === -1 ? predecessor : intersectDominators(predecessor, newDominator, idom, rpoIndex)
      }
      if (newDominator !== -1 && idom[node] !== newDominator) {
        idom[node] = newDominator
        changed = true
      }
    }
  }
  return idom
}

const computeRetainedSizes = (snapshot: Snapshot, access: NodeAccess, idom: Int32Array, rpo: readonly number[]): Float64Array => {
  const retainedSizes = new Float64Array(idom.length)
  for (let nodeIndex = 0; nodeIndex < idom.length; nodeIndex++) {
    retainedSizes[nodeIndex] = snapshot.nodes[nodeIndex * access.itemsPerNode + access.selfSizeOffset] || 0
  }
  for (let index = rpo.length - 1; index > 0; index--) {
    const node = rpo[index]
    const dominator = idom[node]
    if (dominator >= 0 && dominator !== node) {
      retainedSizes[dominator] += retainedSizes[node]
    }
  }
  return retainedSizes
}

export const buildRetainerGraph = (snapshot: Snapshot): Graph => {
  const nodeAccess = getNodeAccess(snapshot)
  const edgeAccess = getEdgeAccess(snapshot)
  const { outgoingEdgeIndices, outgoingOffsets, outgoingTargets } = buildOutgoingGraph(snapshot, nodeAccess, edgeAccess)
  const { parent, parentEdgeOffset, reachable } = getReachable(outgoingOffsets, outgoingTargets)
  const parentEdge = new Uint32Array(parent.length)
  parentEdge.fill(MissingNode)
  for (let node = 1; node < parent.length; node++) {
    const offset = parentEdgeOffset[node]
    if (offset !== MissingNode) {
      parentEdge[node] = outgoingEdgeIndices[offset]
    }
  }
  const { incomingOffsets, incomingSources } = buildIncomingGraph(outgoingOffsets, outgoingTargets)
  const rpo = getReversePostOrder(outgoingOffsets, outgoingTargets, reachable)
  const idom = computeDominators(incomingOffsets, incomingSources, reachable, rpo)
  const retainedSizes = computeRetainedSizes(snapshot, nodeAccess, idom, rpo)
  return {
    idom,
    incomingOffsets,
    incomingSources,
    outgoingEdgeIndices,
    outgoingOffsets,
    outgoingTargets,
    parent,
    parentEdge,
    reachable,
    retainedSizes,
    rpo,
  }
}

const getTraceStacks = (snapshot: Snapshot): ReadonlyMap<number, readonly StackFrame[]> => {
  const fields = snapshot.meta.trace_function_info_fields || []
  const traceFields = snapshot.meta.trace_node_fields || []
  const itemsPerFunction = fields.length
  const infos = snapshot.traceFunctionInfos || new Uint32Array()
  const nameOffset = fields.indexOf('name')
  const scriptNameOffset = fields.indexOf('script_name')
  const scriptIdOffset = fields.indexOf('script_id')
  const lineOffset = fields.indexOf('line')
  const columnOffset = fields.indexOf('column')
  const frames: StackFrame[] = []
  if (
    itemsPerFunction > 0 &&
    nameOffset !== -1 &&
    scriptNameOffset !== -1 &&
    scriptIdOffset !== -1 &&
    lineOffset !== -1 &&
    columnOffset !== -1
  ) {
    for (let offset = 0; offset < infos.length; offset += itemsPerFunction) {
      const functionName = snapshot.strings[infos[offset + nameOffset]] || '(anonymous)'
      const source = snapshot.strings[infos[offset + scriptNameOffset]] || ''
      const generated = source
        ? {
            column: infos[offset + columnOffset],
            line: infos[offset + lineOffset],
            scriptId: infos[offset + scriptIdOffset],
            source,
          }
        : undefined
      frames.push({
        ...(generated ? { generated } : {}),
        functionName,
      })
    }
  }

  const stacks = new Map<number, readonly StackFrame[]>()
  const traceTree = snapshot.traceTree || new Uint32Array()
  const traceTreeParents = snapshot.traceTreeParents || new Uint32Array()
  const recordLength = traceFields.indexOf('children')
  const idOffset = traceFields.indexOf('id')
  const functionInfoIndexOffset = traceFields.indexOf('function_info_index')
  if (recordLength <= 0 || idOffset === -1 || functionInfoIndexOffset === -1) {
    return stacks
  }
  for (let offset = 0, nodeIndex = 0; offset < traceTree.length; offset += recordLength, nodeIndex++) {
    const id = traceTree[offset + idOffset]
    const frame = frames[traceTree[offset + functionInfoIndexOffset]]
    const parentStack = stacks.get(traceTreeParents[nodeIndex] || 0) || []
    const stack = frame ? [frame, ...parentStack] : parentStack
    stacks.set(id, stack)
  }
  return stacks
}

const getCandidateGroups = (
  before: Snapshot,
  after: Snapshot,
  graph: Graph,
  minimumCount: number,
): ReadonlyMap<string, readonly number[]> => {
  const beforeAccess = getNodeAccess(before)
  const afterAccess = getNodeAccess(after)
  const beforeIds = new Set<number>()
  for (let offset = 0; offset < before.nodes.length; offset += beforeAccess.itemsPerNode) {
    beforeIds.add(before.nodes[offset + beforeAccess.idOffset])
  }
  const groups = new Map<string, number[]>()
  const nodeCount = after.nodes.length / afterAccess.itemsPerNode
  for (let nodeIndex = 1; nodeIndex < nodeCount; nodeIndex++) {
    if (!graph.reachable[nodeIndex]) {
      continue
    }
    const offset = nodeIndex * afterAccess.itemsPerNode
    const id = after.nodes[offset + afterAccess.idOffset]
    if (beforeIds.has(id)) {
      continue
    }
    const type = getNodeType(after, afterAccess, nodeIndex)
    if (ignoredNodeTypes.has(type)) {
      continue
    }
    const name = getNodeName(after, afterAccess, nodeIndex)
    const traceNodeId = afterAccess.traceNodeIdOffset === -1 ? 0 : after.nodes[offset + afterAccess.traceNodeIdOffset]
    const key = traceNodeId ? `trace:${traceNodeId}:${type}:${name}` : `node:${type}:${name}`
    const group = groups.get(key)
    if (group) {
      group.push(nodeIndex)
    } else {
      groups.set(key, [nodeIndex])
    }
  }
  for (const [key, group] of groups) {
    if (group.length < minimumCount) {
      groups.delete(key)
    }
  }
  return groups
}

const removeDominatedCandidates = (
  groups: ReadonlyMap<string, readonly number[]>,
  idom: Int32Array,
): ReadonlyMap<string, readonly number[]> => {
  const candidates = new Uint8Array(idom.length)
  for (const group of groups.values()) {
    for (const node of group) {
      candidates[node] = 1
    }
  }
  const result = new Map<string, readonly number[]>()
  for (const [key, group] of groups) {
    const selected: number[] = []
    for (const node of group) {
      let ancestor = idom[node]
      let isDominatedByCandidate = false
      while (ancestor > 0 && ancestor !== idom[ancestor]) {
        if (candidates[ancestor]) {
          isDominatedByCandidate = true
          break
        }
        ancestor = idom[ancestor]
      }
      if (!isDominatedByCandidate) {
        selected.push(node)
      }
    }
    if (selected.length > 0) {
      result.set(key, selected)
    }
  }
  return result
}

const getPath = (node: number, parent: Uint32Array): readonly number[] => {
  const path: number[] = []
  let current = node
  while (current !== MissingNode) {
    path.push(current)
    if (current === 0) {
      break
    }
    current = parent[current]
  }
  return path.reverse()
}

const getEdgeSegment = (
  snapshot: Snapshot,
  nodeAccess: NodeAccess,
  edgeAccess: EdgeAccess,
  source: number,
  target: number,
  edgeIndex: number,
): PathSegment => {
  const offset = edgeIndex * edgeAccess.itemsPerEdge
  const typeIndex = snapshot.edges[offset + edgeAccess.typeOffset]
  const edgeType = edgeAccess.typeNames[typeIndex] || `type_${typeIndex}`
  const nameOrIndex = snapshot.edges[offset + edgeAccess.nameOffset]
  const property = edgeType === 'element' ? `[${nameOrIndex}]` : snapshot.strings[nameOrIndex] || edgeType
  return {
    edgeType,
    property,
    sourceName: getNodeName(snapshot, nodeAccess, source),
    sourceType: getNodeType(snapshot, nodeAccess, source),
    targetName: getNodeName(snapshot, nodeAccess, target),
  }
}

const getStageNodes = (
  snapshot: Snapshot,
  access: NodeAccess,
  path: readonly number[],
  traceStacks: ReadonlyMap<number, readonly StackFrame[]>,
): {
  readonly inferred: boolean
  readonly inferredLabel?: string
  readonly leak: number
  readonly retainer: number
  readonly root: number
  readonly service: number
} => {
  const leak = path.at(-1) || 0
  const root = path[0] || 0
  let service = -1
  for (let index = path.length - 2; index > 0; index--) {
    if (servicePattern.test(getNodeName(snapshot, access, path[index]))) {
      service = path[index]
      break
    }
  }
  const inferred = service === -1
  let inferredLabel: string | undefined
  if (service === -1) {
    for (let index = path.length - 2; index > 0; index--) {
      const node = path[index]
      const traceNodeId = access.traceNodeIdOffset === -1 ? 0 : snapshot.nodes[node * access.itemsPerNode + access.traceNodeIdOffset]
      const source = traceStacks.get(traceNodeId)?.[0]?.generated?.source
      if (source) {
        service = node
        inferredLabel = `${source.split(/[\\/]/).at(-1)} (inferred owner)`
        break
      }
    }
    if (service === -1) {
      const leakTraceNodeId = access.traceNodeIdOffset === -1 ? 0 : snapshot.nodes[leak * access.itemsPerNode + access.traceNodeIdOffset]
      const source = traceStacks.get(leakTraceNodeId)?.[0]?.generated?.source
      if (source) {
        service = path[1] ?? root
        inferredLabel = `${source.split(/[\\/]/).at(-1)} (inferred owner)`
      }
    }
    if (service === -1) {
      service = path[1] ?? root
      inferredLabel = `${getNodeName(snapshot, access, service)} (inferred owner)`
    }
  }
  let retainer = -1
  for (let index = path.length - 2; index > 0; index--) {
    const node = path[index]
    const name = getNodeName(snapshot, access, node)
    const type = getNodeType(snapshot, access, node)
    if (node !== service && (type === 'array' || type === 'closure' || collectionPattern.test(name))) {
      retainer = node
      break
    }
  }
  if (retainer === -1) {
    retainer = path.at(-2) ?? service
  }
  return { inferred, ...(inferredLabel ? { inferredLabel } : {}), leak, retainer, root, service }
}

const getKind = (snapshot: Snapshot, access: NodeAccess, node: number): string => {
  const name = getNodeName(snapshot, access, node)
  const type = getNodeType(snapshot, access, node)
  if (servicePattern.test(name)) {
    return 'service'
  }
  if (collectionPattern.test(name)) {
    return type === 'closure' ? 'closure' : 'collection'
  }
  return type
}

export const getRetainerRiverAnalysis = (
  before: Snapshot,
  after: Snapshot,
  options: { readonly minimumCount?: number } = {},
): RetainerRiverAnalysis => {
  const minimumCount = Math.max(1, options.minimumCount || 1)
  const graph = buildRetainerGraph(after)
  const candidateGroups = removeDominatedCandidates(getCandidateGroups(before, after, graph, minimumCount), graph.idom)
  const nodeAccess = getNodeAccess(after)
  const edgeAccess = getEdgeAccess(after)
  const traceStacks = getTraceStacks(after)
  const nodes: RiverNode[] = []
  const links: RiverLink[] = []
  let flowIndex = 0
  let leakedObjects = 0
  let totalRetainedBytes = 0

  for (const group of candidateGroups.values()) {
    const representative = group.toSorted((a, b) => graph.retainedSizes[b] - graph.retainedSizes[a])[0]
    const path = getPath(representative, graph.parent)
    if (path.length < 2) {
      continue
    }
    const retainedBytes = Math.max(1, Math.round(group.reduce((total, node) => total + graph.retainedSizes[node], 0)))
    const stages = getStageNodes(after, nodeAccess, path, traceStacks)
    const flowId = `flow-${flowIndex++}`
    const evidence: Evidence[] = group.map((candidate) => {
      const candidatePath = getPath(candidate, graph.parent)
      const pathSegments: PathSegment[] = []
      for (let index = 1; index < candidatePath.length; index++) {
        pathSegments.push(
          getEdgeSegment(
            after,
            nodeAccess,
            edgeAccess,
            candidatePath[index - 1],
            candidatePath[index],
            graph.parentEdge[candidatePath[index]],
          ),
        )
      }
      const retainingNode = candidatePath.at(-2) || stages.retainer
      const retainingTraceId =
        nodeAccess.traceNodeIdOffset === -1 ? 0 : after.nodes[retainingNode * nodeAccess.itemsPerNode + nodeAccess.traceNodeIdOffset]
      const leakedTraceId =
        nodeAccess.traceNodeIdOffset === -1 ? 0 : after.nodes[candidate * nodeAccess.itemsPerNode + nodeAccess.traceNodeIdOffset]
      const allocationStack = traceStacks.get(retainingTraceId) || []
      const leakedObjectStack = traceStacks.get(leakedTraceId) || []
      return {
        allocationStack,
        leakedObject: getNodeName(after, nodeAccess, candidate),
        leakedObjectStack,
        path: pathSegments,
        ...(allocationStack[0]?.generated ? { retainingLocation: allocationStack[0].generated } : {}),
        retainingProperty: pathSegments.at(-1)?.property || '(unknown)',
      }
    })
    const stageEntries = [
      { node: stages.root, stage: 'root' as const },
      { node: stages.service, stage: 'service' as const },
      { node: stages.retainer, stage: 'retainer' as const },
      { node: stages.leak, stage: 'leak' as const },
    ]
    const flowNodes = stageEntries.map(({ node, stage }) => {
      const name = getNodeName(after, nodeAccess, node)
      return {
        id: `${flowId}:${stage}`,
        ...(stage === 'service' && stages.inferred ? { inferred: true } : {}),
        kind: stage === 'service' && stages.inferred ? 'source owner' : getKind(after, nodeAccess, node),
        label: stage === 'service' && stages.inferred ? stages.inferredLabel || `${name} (inferred owner)` : name,
        objectCount: group.length,
        retainedBytes,
        stage,
      }
    })
    nodes.push(...flowNodes)
    for (let index = 0; index < flowNodes.length - 1; index++) {
      links.push({
        evidence,
        flowId,
        id: `${flowId}:${index}`,
        objectCount: group.length,
        retainedBytes,
        source: flowNodes[index].id,
        target: flowNodes[index + 1].id,
      })
    }
    leakedObjects += group.length
    totalRetainedBytes += retainedBytes
  }

  return {
    generatedAt: new Date().toISOString(),
    isLeak: links.length > 0,
    links,
    metadata: {
      processType: 'inspected-target',
      runs: minimumCount,
      testName: 'retainer-river',
    },
    nodes,
    schemaVersion: 1,
    summary: {
      leakedObjects,
      retainedBytes: totalRetainedBytes,
      retainingPaths: links.length / 3,
    },
  }
}

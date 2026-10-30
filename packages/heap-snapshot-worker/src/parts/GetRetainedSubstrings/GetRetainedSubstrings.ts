import type { Snapshot } from '../Snapshot/Snapshot.ts'

const MissingNode = 0xffffffff
const MinimumParentBytes = 64 * 1024
const MaximumParents = 50
const MaximumExamples = 8
const MaximumPathLength = 32
const MaximumNameLength = 80

export interface SubstringPathSegment {
  readonly nodeId: number
  readonly name: string
  readonly type: string
  readonly property: string
}

export interface RetainedSubstringParent {
  readonly parentNodeId: number
  readonly parentBytes: number
  readonly exclusivelyRetained: boolean
  readonly sliceCount: number
  readonly examples: readonly {
    readonly sliceNodeId: number
    readonly name: string
    readonly path: readonly SubstringPathSegment[]
    readonly pathTruncated: boolean
  }[]
}

export interface RetainedSubstringsReport {
  readonly parentBytes: number
  readonly exclusivelyRetainedBytes: number
  readonly parentCount: number
  readonly sliceCount: number
  readonly parents: readonly RetainedSubstringParent[]
  readonly parentsTruncated: boolean
}

export const getRetainedSubstrings = (snapshot: Snapshot): RetainedSubstringsReport => {
  const { nodes, edges, strings, meta, node_count: nodeCount } = snapshot
  const nodeWidth = meta.node_fields.length
  const edgeWidth = meta.edge_fields.length
  const nodeOffset = (name: string): number => {
    const offset = meta.node_fields.indexOf(name)
    if (offset < 0) throw new Error(`retained-substrings: missing node field ${name}`)
    return offset
  }
  const edgeOffset = (name: string): number => {
    const offset = meta.edge_fields.indexOf(name)
    if (offset < 0) throw new Error(`retained-substrings: missing edge field ${name}`)
    return offset
  }
  const typeOffset = nodeOffset('type')
  const nameOffset = nodeOffset('name')
  const idOffset = nodeOffset('id')
  const sizeOffset = nodeOffset('self_size')
  const countOffset = nodeOffset('edge_count')
  const edgeTypeOffset = edgeOffset('type')
  const edgeNameOffset = edgeOffset('name_or_index')
  const targetOffset = edgeOffset('to_node')
  const nodeTypes = meta.node_types[typeOffset] || []
  const edgeTypes = meta.edge_types[edgeTypeOffset] || []
  const type = (ordinal: number): string => nodeTypes[nodes[ordinal * nodeWidth + typeOffset]]
  const name = (ordinal: number): string => strings[nodes[ordinal * nodeWidth + nameOffset]] || ''
  const id = (ordinal: number): number => nodes[ordinal * nodeWidth + idOffset]
  const size = (ordinal: number): number => nodes[ordinal * nodeWidth + sizeOffset]
  const firstEdges = new Uint32Array(nodeCount + 1)
  const sliceParents = new Uint32Array(nodeCount)
  sliceParents.fill(MissingNode)
  let cursor = 0
  for (let ordinal = 0; ordinal < nodeCount; ordinal++) {
    firstEdges[ordinal] = cursor
    const end = cursor + nodes[ordinal * nodeWidth + countOffset] * edgeWidth
    for (; cursor < end; cursor += edgeWidth) {
      if (
        type(ordinal) === 'sliced string' &&
        edgeTypes[edges[cursor + edgeTypeOffset]] === 'internal' &&
        strings[edges[cursor + edgeNameOffset]] === 'parent'
      ) {
        sliceParents[ordinal] = edges[cursor + targetOffset] / nodeWidth
      }
    }
  }
  firstEdges[nodeCount] = cursor

  // Two linear breadth-first traversals distinguish parents with independent
  // strong references from those reachable only through slice-parent edges.
  const traverse = (cutSliceParents: boolean) => {
    const parent = new Uint32Array(nodeCount)
    const parentEdge = new Uint32Array(nodeCount)
    parent.fill(MissingNode)
    const queue = new Uint32Array(nodeCount)
    let length = 0
    if (nodeCount > 0) {
      parent[0] = 0
      queue[length++] = 0
    }
    for (let index = 0; index < length; index++) {
      const ordinal = queue[index]
      for (let edge = firstEdges[ordinal]; edge < firstEdges[ordinal + 1]; edge += edgeWidth) {
        const edgeType = edgeTypes[edges[edge + edgeTypeOffset]]
        if (edgeType === 'weak' || (edgeType === 'shortcut' && ordinal !== 0)) continue
        const target = edges[edge + targetOffset] / nodeWidth
        if (
          cutSliceParents &&
          sliceParents[ordinal] === target &&
          edgeType === 'internal' &&
          strings[edges[edge + edgeNameOffset]] === 'parent'
        )
          continue
        if (parent[target] !== MissingNode) continue
        parent[target] = ordinal
        parentEdge[target] = edge
        queue[length++] = target
      }
    }
    return { parent, parentEdge }
  }
  const reachable = traverse(false)
  const independent = traverse(true).parent

  // Memoize ultimate parents so shared chains remain linear, and reject cycles
  // or unsupported parent representations rather than inventing byte counts.
  const resolved = new Int32Array(nodeCount)
  resolved.fill(-2)
  const resolve = (start: number): number => {
    const chain: number[] = []
    let current = start
    while (current !== MissingNode && resolved[current] === -2 && type(current) === 'sliced string') {
      resolved[current] = -1
      chain.push(current)
      current = sliceParents[current]
    }
    const result = current === MissingNode ? -1 : type(current) === 'string' ? current : resolved[current]
    for (const ordinal of chain) resolved[ordinal] = result >= 0 ? result : -1
    return resolved[start]
  }
  const groups = new Map<number, { count: number; examples: number[] }>()
  for (let ordinal = 0; ordinal < nodeCount; ordinal++) {
    if (type(ordinal) !== 'sliced string' || reachable.parent[ordinal] === MissingNode) continue
    const parent = resolve(ordinal)
    if (parent < 0 || size(parent) < MinimumParentBytes) continue
    const group = groups.get(parent) || { count: 0, examples: [] }
    group.count++
    if (group.examples.length < MaximumExamples) group.examples.push(ordinal)
    groups.set(parent, group)
  }
  const ranked = [...groups].sort((a, b) => size(b[0]) - size(a[0]) || id(a[0]) - id(b[0]))
  const parents = ranked.slice(0, MaximumParents).map(([parent, group]): RetainedSubstringParent => ({
    parentNodeId: id(parent),
    parentBytes: size(parent),
    exclusivelyRetained: independent[parent] === MissingNode,
    sliceCount: group.count,
    examples: group.examples.map((ordinal) => {
      const path: SubstringPathSegment[] = []
      let current = ordinal
      while (current !== 0 && path.length < MaximumPathLength) {
        const edge = reachable.parentEdge[current]
        const edgeType = edgeTypes[edges[edge + edgeTypeOffset]]
        const edgeName = edges[edge + edgeNameOffset]
        path.push({
          nodeId: id(current),
          name: name(current).slice(0, MaximumNameLength),
          type: type(current),
          property:
            edgeType === 'element' || edgeType === 'hidden' ? `[${edgeName}]` : (strings[edgeName] || edgeType).slice(0, MaximumNameLength),
        })
        current = reachable.parent[current]
      }
      return {
        sliceNodeId: id(ordinal),
        name: name(ordinal).slice(0, MaximumNameLength),
        path: path.reverse(),
        pathTruncated: current !== 0,
      }
    }),
  }))
  return {
    parentBytes: ranked.reduce((total, [parent]) => total + size(parent), 0),
    exclusivelyRetainedBytes: ranked.reduce((total, [parent]) => total + (independent[parent] === MissingNode ? size(parent) : 0), 0),
    parentCount: ranked.length,
    sliceCount: ranked.reduce((total, [, group]) => total + group.count, 0),
    parents,
    parentsTruncated: ranked.length > MaximumParents,
  }
}

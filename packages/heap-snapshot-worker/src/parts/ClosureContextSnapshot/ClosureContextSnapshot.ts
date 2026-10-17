import { computeMemoryCityDominators } from '../ComputeMemoryCityDominators/ComputeMemoryCityDominators.ts'
import type { Snapshot, SnapshotMetaData } from '../Snapshot/Snapshot.ts'

export interface ClosureSnapshotProfile {
  snapshot: {
    meta: SnapshotMetaData & {
      scope_fields?: string[]
      scope_context_var_fields?: string[]
      scope_use_fields?: string[]
    }
    node_count: number
    edge_count: number
  }
  nodes: number[]
  edges: number[]
  strings: string[]
  scopes?: number[]
  scope_context_vars?: number[]
  scope_uses?: number[]
}

/** Minimal heap graph interface used by the Chromium context analysis. */
export class HeapSnapshot {
  readonly nodes: Uint32Array
  readonly strings: string[]
  readonly nodeFieldCount: number
  readonly nodeClosureType: number
  readonly nodeObjectType: number
  readonly firstEdges: Uint32Array
  readonly retainedSizes: Float64Array
  readonly dominators: Uint32Array
  readonly edgeFieldCount: number
  readonly profile: ClosureSnapshotProfile
  constructor(profile: ClosureSnapshotProfile) {
    this.profile = profile
    this.nodes = Uint32Array.from(profile.nodes)
    this.strings = profile.strings
    this.nodeFieldCount = profile.snapshot.meta.node_fields.length
    this.edgeFieldCount = profile.snapshot.meta.edge_fields.length
    const types = profile.snapshot.meta.node_types[0]
    this.nodeClosureType = types.indexOf('closure')
    this.nodeObjectType = types.indexOf('object')
    this.firstEdges = new Uint32Array(profile.snapshot.node_count + 1)
    const countOffset = profile.snapshot.meta.node_fields.indexOf('edge_count')
    for (let i = 0; i < profile.snapshot.node_count; i++) {
      this.firstEdges[i + 1] = this.firstEdges[i] + this.nodes[i * this.nodeFieldCount + countOffset] * this.edgeFieldCount
    }
    const snapshot: Snapshot = {
      ...profile.snapshot,
      nodes: this.nodes,
      edges: Uint32Array.from(profile.edges),
      strings: this.strings,
      locations: new Uint32Array(),
      extra_native_bytes: 0,
    }
    const result = computeMemoryCityDominators(snapshot)
    this.retainedSizes = result.retainedSizes
    this.dominators = result.dominators
  }
  createNode() {
    return new HeapSnapshotNode(this, 0)
  }
  isContextObject(node: HeapSnapshotNode) {
    return node.rawName() === 'system / Context' || node.rawName().startsWith('system / Context / ')
  }
}

export class HeapSnapshotNode {
  readonly snapshot: HeapSnapshot
  nodeIndex: number
  constructor(snapshot: HeapSnapshot, nodeIndex: number) {
    this.snapshot = snapshot
    this.nodeIndex = nodeIndex
  }
  private field(name: string) {
    return this.snapshot.nodes[this.nodeIndex + this.snapshot.profile.snapshot.meta.node_fields.indexOf(name)]
  }
  rawName() {
    return this.snapshot.strings[this.field('name')]
  }
  name() {
    return this.rawName()
  }
  id() {
    return this.field('id')
  }
  rawType() {
    return this.field('type')
  }
  type() {
    return this.snapshot.profile.snapshot.meta.node_types[0][this.rawType()]
  }
  selfSize() {
    return this.field('self_size')
  }
  retainedSize() {
    return this.snapshot.retainedSizes[this.nodeIndex / this.snapshot.nodeFieldCount]
  }
  edges() {
    return new EdgeIterator(this)
  }
  findInternalEdgeTarget(name: string): HeapSnapshotNode | undefined {
    for (const iter = this.edges(); iter.hasNext(); iter.next()) {
      if (iter.edge.type() === 'internal' && iter.edge.name() === name) return iter.edge.node()
    }
    return undefined
  }
  nodeValueAsInt(): number | undefined {
    if (this.type() !== 'number' || this.rawName() !== 'int') return undefined
    const value = this.findInternalEdgeTarget('value')
    if (!value) return undefined
    const number = Number(value.rawName())
    return Number.isInteger(number) ? number : undefined
  }
}

class Edge {
  readonly snapshot: HeapSnapshot
  index: number
  constructor(snapshot: HeapSnapshot, index: number) {
    this.snapshot = snapshot
    this.index = index
  }
  private field(name: string) {
    return this.snapshot.profile.edges[this.index + this.snapshot.profile.snapshot.meta.edge_fields.indexOf(name)]
  }
  type() {
    return this.snapshot.profile.snapshot.meta.edge_types[0][this.field('type')]
  }
  name() {
    return this.snapshot.strings[this.field('name_or_index')]
  }
  nodeIndex() {
    return this.field('to_node')
  }
  node() {
    return new HeapSnapshotNode(this.snapshot, this.nodeIndex())
  }
}

class EdgeIterator {
  readonly edge: Edge
  readonly end: number
  constructor(node: HeapSnapshotNode) {
    const ordinal = node.nodeIndex / node.snapshot.nodeFieldCount
    this.edge = new Edge(node.snapshot, node.snapshot.firstEdges[ordinal])
    this.end = node.snapshot.firstEdges[ordinal + 1]
  }
  hasNext() {
    return this.edge.index < this.end
  }
  next() {
    this.edge.index += this.edge.snapshot.edgeFieldCount
  }
  item() {
    return this.edge
  }
}

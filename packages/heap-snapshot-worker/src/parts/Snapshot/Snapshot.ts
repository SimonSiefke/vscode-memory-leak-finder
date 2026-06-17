type NodeTypes = [readonly string[]]
type EdgeTypes = [readonly string[]]
export type HeapSnapshotValue = string | number
export type HeapSnapshotRecord = Readonly<Record<string, HeapSnapshotValue>>
export type NumberArray = ArrayLike<number>

export interface ParsedNode extends HeapSnapshotRecord {
  readonly edgeCount: number
  readonly id: number
  readonly name: string
  readonly type: string
}

export interface CleanedNode {
  readonly id: number
  readonly name: string
  readonly type: string
}

export interface ParsedEdge extends HeapSnapshotRecord {
  readonly nameOrIndex: string
  readonly toNode: number
  readonly type: string
}

export interface GraphEdge {
  readonly index: number
  readonly name: string
}

export type HeapSnapshotGraph = Record<number, GraphEdge[]>

export interface ParsedLocation {
  readonly columnIndex: number
  readonly lineIndex: number
  readonly objectIndex: number
  readonly scriptIdIndex: number
}

export interface ParsedHeapSnapshot {
  readonly graph: HeapSnapshotGraph
  readonly locations: readonly ParsedLocation[]
  readonly parsedNodes: readonly CleanedNode[]
}

export interface CountItem {
  readonly count: number
  readonly name: string
}

export interface CountDeltaItem extends CountItem {
  readonly delta: number
}

export interface SnapshotMetaData {
  readonly edge_fields: readonly string[]
  readonly edge_types: EdgeTypes
  readonly location_fields: readonly string[]
  readonly node_fields: readonly string[]
  readonly node_types: NodeTypes
}

export interface Snapshot {
  readonly edge_count?: number
  readonly edges: NumberArray
  readonly extra_native_bytes?: number
  readonly locations: NumberArray
  readonly meta: SnapshotMetaData
  readonly node_count?: number
  readonly nodes: NumberArray
  readonly snapshot?: {
    readonly meta: SnapshotMetaData
  }
  readonly strings: readonly string[]
}

export interface HeapSnapshotInput {
  readonly edges: NumberArray
  readonly locations: NumberArray
  readonly meta?: SnapshotMetaData
  readonly nodes: NumberArray
  readonly snapshot?: {
    readonly meta: SnapshotMetaData
  }
  readonly strings: readonly string[]
}

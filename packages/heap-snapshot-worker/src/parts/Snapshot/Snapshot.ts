type NodeTypes = [readonly string[]]
type EdgeTypes = [readonly string[]]

export interface SnapshotMetaData {
  readonly edge_fields: readonly string[]
  readonly edge_types: EdgeTypes
  readonly location_fields: readonly string[]
  readonly node_fields: readonly string[]
  readonly node_types: NodeTypes
}

export interface Snapshot {
  readonly edge_count: number
  readonly edges: Uint32Array
  readonly extra_native_bytes: number
  readonly locations: Uint32Array
  readonly meta: SnapshotMetaData
  readonly node_count: number
  readonly nodes: Uint32Array
  readonly strings: readonly string[]
}

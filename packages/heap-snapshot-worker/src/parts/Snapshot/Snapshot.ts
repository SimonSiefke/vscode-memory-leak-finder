export interface SnapshotMetaData {
  readonly node_fields: readonly string[]
  readonly node_types: readonly string[]
  readonly edge_fields: readonly string[]
  readonly edge_types: readonly string[]
  readonly location_fields: readonly string[]
  readonly node_count: number
  readonly edge_count: number
  readonly extra_native_bytes: number
}

export interface Snapshot {
  readonly nodes: Uint32Array
  readonly edges: Uint32Array
  readonly locations: Uint32Array
  readonly strings: readonly string[]
}

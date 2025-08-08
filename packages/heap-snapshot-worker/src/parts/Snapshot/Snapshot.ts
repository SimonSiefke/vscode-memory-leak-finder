export interface Snapshot {
  readonly nodes: Uint32Array
  readonly edges: Uint32Array
  readonly locations: Uint32Array
  readonly strings: readonly string[]
}

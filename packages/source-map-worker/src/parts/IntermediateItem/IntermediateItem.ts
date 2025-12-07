export interface IntermediateItem {
  readonly line: number | null
  readonly column: number | null
  readonly codePath: string | null
  readonly name: string | null
  readonly needsOriginalName: boolean
  readonly source: string | null
}

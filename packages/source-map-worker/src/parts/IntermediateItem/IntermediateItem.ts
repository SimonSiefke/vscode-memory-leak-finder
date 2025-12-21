export interface IntermediateItem {
  readonly codePath: string | null
  readonly column: number | null
  readonly line: number | null
  readonly name: string | null
  readonly needsOriginalName: boolean
  readonly source: string | null
}

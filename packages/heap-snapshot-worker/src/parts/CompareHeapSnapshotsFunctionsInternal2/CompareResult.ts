export interface CompareResult {
  readonly column: number
  readonly count: number
  readonly delta: number
  readonly line: number
  readonly name: string
  readonly originalColumn?: number | null
  readonly originalLine?: number | null
  readonly originalLocation?: string
  readonly originalName?: string | null
  readonly originalSource?: string | null
  readonly originalUrl?: string | null
  readonly scriptId: number
  sourceLocation?: string
  sourceMapUrl?: string
  url?: string
}

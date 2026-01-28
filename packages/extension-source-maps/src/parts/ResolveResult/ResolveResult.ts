export interface ResolveResult {
  readonly originalColumn?: number | null
  readonly originalLine?: number | null
  readonly originalLocation?: string | null
  readonly originalName?: string | null
  readonly originalSource?: string | null
  readonly originalUrl?: string | null
}

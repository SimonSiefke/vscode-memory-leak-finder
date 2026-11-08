export interface OriginalLocation {
  readonly source: string
  readonly line: number
  readonly column: number
  readonly name: string | null
  preview: string | null
}

export type SourceMapReference = { readonly url: string } | { readonly start: number; readonly end: number }

export interface SourceMapResult {
  readonly locations: readonly (OriginalLocation | null)[]
  readonly url: string
}

export interface SourceMapSummary {
  readonly status: 'mapped' | 'unavailable' | 'skipped'
  readonly occurrences: number
  readonly mapped: number
  readonly url?: string
  readonly reason?: string
}

export interface FunctionOccurrence {
  readonly file: string
  readonly name: string
  readonly start: number
  readonly end: number
  readonly line: number
  readonly column: number
  readonly bytes: number
  originalLocation?: OriginalLocation
}

export interface ReportedFunctionOccurrence {
  readonly file: string
  readonly originalName: string | null
  readonly name: string
  readonly bytes: number
  readonly originalFile: string | null
  readonly preview: string | null
}

export interface FunctionFingerprint {
  readonly hash: string
  readonly occurrence: FunctionOccurrence
}

export interface FileAnalysis {
  readonly file: string
  readonly functions: number
  readonly skippedDynamicFunctions: number
  readonly fingerprints: readonly FunctionFingerprint[]
  readonly sourceMap?: SourceMapReference
}

export interface DuplicateGroup {
  readonly hash: string
  readonly count: number
  readonly duplicateBytes: number
  readonly occurrences: readonly FunctionOccurrence[]
}

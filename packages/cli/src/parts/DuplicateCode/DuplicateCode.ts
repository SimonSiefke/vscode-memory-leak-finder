export interface FunctionOccurrence {
  readonly file: string
  readonly name: string
  readonly start: number
  readonly end: number
  readonly line: number
  readonly column: number
  readonly bytes: number
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
}

export interface DuplicateGroup {
  readonly hash: string
  readonly count: number
  readonly duplicateBytes: number
  readonly occurrences: readonly FunctionOccurrence[]
}

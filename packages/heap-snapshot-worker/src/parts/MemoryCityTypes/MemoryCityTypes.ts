export interface MemoryCityBuilding {
  readonly kind: 'runtime' | 'source'
  readonly largestObjectRetainedBytes: number
  readonly objectCount: number
  readonly path: string
  readonly retainedBytes: number
  readonly shallowBytes: number
}

export interface MemoryCityTotals {
  readonly allocationTraceObjects: number
  readonly attributedObjects: number
  readonly locationObjects: number
  readonly objectCount: number
  readonly retainedBytes: number
  readonly runtimeObjects: number
  readonly shallowBytes: number
}

export interface MemoryCitySnapshot {
  readonly buildings: readonly MemoryCityBuilding[]
  readonly totals: MemoryCityTotals
}

export interface MemoryCityScriptInfo {
  readonly sourceMapUrl?: string
  readonly url?: string
}

export type MemoryCityScriptMap = Readonly<Record<string, MemoryCityScriptInfo>>

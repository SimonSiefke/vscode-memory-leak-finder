export interface TrackedEverythingSite {
  readonly id: number
  readonly location: string
  readonly originalColumn: number | null
  readonly originalLine: number | null
  readonly originalLocation: string | null
  readonly originalSource: string | null
  readonly type: string
}

export interface TrackedEverythingTimeMark {
  readonly elapsedMs: number
  readonly eventIndex: number
}

export interface TrackedEverythingDataset {
  readonly durationMs: number
  readonly eventCount: number
  readonly eventFile: string
  readonly kind: 'tracked-everything'
  readonly scenario: string
  readonly schemaVersion: 1
  readonly sites: readonly TrackedEverythingSite[]
  readonly timeMarks: readonly TrackedEverythingTimeMark[]
}

export interface TrackedEverythingAggregates {
  readonly cursor: number
  readonly fileCounts: Readonly<Record<string, number>>
  readonly siteCounts: readonly number[]
  readonly timeline: Readonly<Record<string, readonly number[]>>
  readonly typeCounts: Readonly<Record<string, number>>
  readonly types: readonly string[]
}

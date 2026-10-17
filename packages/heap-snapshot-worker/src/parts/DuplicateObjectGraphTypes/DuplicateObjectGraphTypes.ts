export interface GraphProperty {
  readonly key: string
  readonly target: number
}

export interface GraphObject {
  readonly ordinal: number
  readonly prototype: number
  readonly properties: readonly GraphProperty[]
}

export interface DuplicateObjectGraphLimits {
  readonly maxProperties: number
  readonly maxObjects: number
  readonly maxComparisonNodes: number
  readonly maxComparisonWork: number
}

export const defaultLimits: DuplicateObjectGraphLimits = {
  maxProperties: 4096,
  maxObjects: 500_000,
  maxComparisonNodes: 50_000,
  maxComparisonWork: 20_000_000,
}

export interface DuplicateObjectGraphGroup {
  readonly fingerprint: string
  readonly count: number
  readonly duplicateCount: number
  readonly duplicateBytes: number
  readonly representativeNodeId: number
  readonly exampleNodeIds: readonly number[]
  readonly preview: Readonly<Record<string, string>>
}

export interface DuplicateObjectGraphReport {
  readonly complete: boolean
  readonly duplicateBytes: number
  readonly duplicateObjects: number
  readonly groups: readonly DuplicateObjectGraphGroup[]
  readonly statistics: {
    readonly analyzedObjects: number
    readonly opaqueObjects: number
    readonly comparisonWork: number
    readonly unverifiedObjects: number
  }
  readonly limits: DuplicateObjectGraphLimits
}

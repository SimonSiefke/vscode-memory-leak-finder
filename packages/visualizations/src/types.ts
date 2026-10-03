export type MemoryCityOwner = 'extensionHost' | 'renderer'

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

export interface MemoryCityRevision {
  readonly id: string
  readonly label: string
  readonly owners: Record<MemoryCityOwner, MemoryCitySnapshot>
}

export interface MemoryCityDataset {
  readonly revisions: readonly MemoryCityRevision[]
  readonly scenario: string
  readonly schemaVersion: 1
}

export interface BuildingView extends MemoryCityBuilding {
  readonly deltaBytes: number
  readonly growthPercent: number
  readonly growthSlope: number
}

export interface BuildingLayout extends BuildingView {
  readonly color: string
  readonly depth: number
  readonly height: number
  readonly width: number
  readonly x: number
  readonly z: number
}

export interface DistrictLayout {
  readonly depth: number
  readonly height: number
  readonly path: string
  readonly width: number
  readonly x: number
  readonly z: number
}

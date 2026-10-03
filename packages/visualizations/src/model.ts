import type { BuildingView, MemoryCityBuilding, MemoryCityDataset, MemoryCityOwner } from './types.ts'

const emptyBuilding = (path: string, kind: 'runtime' | 'source'): MemoryCityBuilding => ({
  kind,
  largestObjectRetainedBytes: 0,
  objectCount: 0,
  path,
  retainedBytes: 0,
  shallowBytes: 0,
})

export const isMemoryCityDataset = (value: unknown): value is MemoryCityDataset => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as Partial<MemoryCityDataset>
  return (
    candidate.schemaVersion === 1 &&
    typeof candidate.scenario === 'string' &&
    Array.isArray(candidate.revisions) &&
    candidate.revisions.every((revision) => {
      if (!revision || typeof revision.id !== 'string' || typeof revision.label !== 'string' || !revision.owners) {
        return false
      }
      return (['renderer', 'extensionHost'] as const).every((owner) => {
        const snapshot = revision.owners[owner]
        return (
          snapshot &&
          Array.isArray(snapshot.buildings) &&
          snapshot.buildings.every((building: unknown) => {
            if (!building || typeof building !== 'object') {
              return false
            }
            const item = building as Partial<MemoryCityBuilding>
            return (
              typeof item.path === 'string' &&
              (item.kind === 'source' || item.kind === 'runtime') &&
              [item.objectCount, item.retainedBytes, item.shallowBytes, item.largestObjectRetainedBytes].every(Number.isFinite)
            )
          }) &&
          snapshot.totals &&
          Object.values(snapshot.totals).every(Number.isFinite)
        )
      })
    })
  )
}

const getBuildingAtRevision = (
  dataset: MemoryCityDataset,
  owner: MemoryCityOwner,
  revisionIndex: number,
  path: string,
): MemoryCityBuilding => {
  const snapshot = dataset.revisions[revisionIndex]?.owners[owner]
  return (
    snapshot?.buildings.find((building) => building.path === path) ||
    emptyBuilding(path, path.startsWith('runtime/') ? 'runtime' : 'source')
  )
}

const linearSlope = (values: readonly number[]): number => {
  if (values.length < 2) {
    return 0
  }
  const xMean = (values.length - 1) / 2
  const yMean = values.reduce((total, value) => total + value, 0) / values.length
  let numerator = 0
  let denominator = 0
  for (let index = 0; index < values.length; index++) {
    numerator += (index - xMean) * (values[index] - yMean)
    denominator += (index - xMean) ** 2
  }
  return denominator === 0 ? 0 : numerator / denominator
}

export const getBuildingViews = (dataset: MemoryCityDataset, owner: MemoryCityOwner, revisionIndex: number): readonly BuildingView[] => {
  const currentSnapshot = dataset.revisions[revisionIndex]?.owners[owner]
  if (!currentSnapshot) {
    return []
  }
  const startIndex = Math.max(0, revisionIndex - 2)
  const currentByPath = new Map(currentSnapshot.buildings.map((building) => [building.path, building]))
  const unionPaths = [
    ...new Set(dataset.revisions.flatMap((revision) => revision.owners[owner].buildings.map((building) => building.path))),
  ].sort((a, b) => a.localeCompare(b))
  return unionPaths.map((path) => {
    const building = currentByPath.get(path) || emptyBuilding(path, path.startsWith('runtime/') ? 'runtime' : 'source')
    const previous = revisionIndex === 0 ? building : getBuildingAtRevision(dataset, owner, revisionIndex - 1, building.path)
    const values: number[] = []
    for (let index = startIndex; index <= revisionIndex; index++) {
      values.push(getBuildingAtRevision(dataset, owner, index, building.path).retainedBytes)
    }
    const deltaBytes = building.retainedBytes - previous.retainedBytes
    return {
      ...building,
      deltaBytes,
      growthPercent: previous.retainedBytes === 0 ? (building.retainedBytes === 0 ? 0 : 100) : (deltaBytes / previous.retainedBytes) * 100,
      growthSlope: linearSlope(values),
    }
  })
}

export const filterBuildingViews = (
  buildings: readonly BuildingView[],
  query: string,
  rootPath: string,
  showRuntime: boolean,
): readonly BuildingView[] => {
  const normalizedQuery = query.trim().toLowerCase()
  return buildings.filter((building) => {
    if (!showRuntime && building.kind === 'runtime') {
      return false
    }
    if (rootPath && !building.path.startsWith(`${rootPath}/`) && building.path !== rootPath) {
      return false
    }
    return !normalizedQuery || building.path.toLowerCase().includes(normalizedQuery)
  })
}

export const formatBytes = (value: number): string => {
  if (!Number.isFinite(value) || value === 0) {
    return '0 B'
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const unitIndex = Math.min(Math.floor(Math.log(Math.abs(value)) / Math.log(1024)), units.length - 1)
  return `${(value / 1024 ** unitIndex).toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

export const getCoverage = (dataset: MemoryCityDataset, owner: MemoryCityOwner, revisionIndex: number): number => {
  const totals = dataset.revisions[revisionIndex]?.owners[owner]?.totals
  return !totals || totals.objectCount === 0 ? 0 : (totals.attributedObjects / totals.objectCount) * 100
}

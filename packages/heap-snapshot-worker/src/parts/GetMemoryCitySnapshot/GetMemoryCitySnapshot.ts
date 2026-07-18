import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { computeMemoryCityDominators } from '../ComputeMemoryCityDominators/ComputeMemoryCityDominators.ts'
import type { MemoryCityBuilding, MemoryCityScriptMap, MemoryCitySnapshot, MemoryCityTotals } from '../MemoryCityTypes/MemoryCityTypes.ts'
import { resolveMemoryCitySources } from '../ResolveMemoryCitySources/ResolveMemoryCitySources.ts'

interface MutableBuilding {
  kind: 'runtime' | 'source'
  largestObjectRetainedBytes: number
  objectCount: number
  path: string
  retainedBytes: number
  shallowBytes: number
}

const buildDominatorChildren = (dominators: Uint32Array, rootOrdinal: number): readonly number[][] => {
  const children = Array.from({ length: dominators.length }, () => [] as number[])
  for (let ordinal = 0; ordinal < dominators.length; ordinal++) {
    if (ordinal !== rootOrdinal) {
      children[dominators[ordinal]].push(ordinal)
    }
  }
  return children
}

const getRuntimePath = (snapshot: Snapshot, ordinal: number, typeOffset: number, nodeFieldCount: number): string => {
  const typeIndex = snapshot.nodes[ordinal * nodeFieldCount + typeOffset]
  const type = snapshot.meta.node_types[0]?.[typeIndex] || 'unknown'
  return `runtime/unattributed/${type.replaceAll(' ', '-')}`
}

const compareBuildings = (a: MemoryCityBuilding, b: MemoryCityBuilding): number => {
  return b.retainedBytes - a.retainedBytes || a.path.localeCompare(b.path)
}

export const getMemoryCitySnapshot = async (snapshot: Snapshot, scriptMap: MemoryCityScriptMap): Promise<MemoryCitySnapshot> => {
  const { dominators, retainedSizes } = computeMemoryCityDominators(snapshot)
  const { allocationSources, locationSources } = await resolveMemoryCitySources(snapshot, scriptMap)
  const nodeFields = snapshot.meta.node_fields
  const nodeFieldCount = nodeFields.length
  const selfSizeOffset = nodeFields.indexOf('self_size')
  const traceNodeIdOffset = nodeFields.indexOf('trace_node_id')
  const typeOffset = nodeFields.indexOf('type')
  const rootOrdinal = 0
  const children = buildDominatorChildren(dominators, rootOrdinal)
  const sourceByOrdinal = new Array<string | undefined>(snapshot.node_count)
  const originByOrdinal = new Uint8Array(snapshot.node_count)
  for (const [ordinal, source] of locationSources) {
    sourceByOrdinal[ordinal] = source
    originByOrdinal[ordinal] = 2
  }
  if (traceNodeIdOffset !== -1) {
    for (let ordinal = 0; ordinal < snapshot.node_count; ordinal++) {
      const traceId = snapshot.nodes[ordinal * nodeFieldCount + traceNodeIdOffset]
      const source = allocationSources.get(traceId)
      if (source) {
        sourceByOrdinal[ordinal] = source
        originByOrdinal[ordinal] = 1
      }
    }
  }

  const stack: Array<{ ordinal: number; inheritedSource?: string }> = [{ ordinal: rootOrdinal }]
  while (stack.length > 0) {
    const { inheritedSource, ordinal } = stack.pop()!
    const ownSource = sourceByOrdinal[ordinal]
    const source = ownSource || inheritedSource
    if (!ownSource && source) {
      sourceByOrdinal[ordinal] = source
      originByOrdinal[ordinal] = 3
    }
    for (const child of children[ordinal]) {
      stack.push(source === undefined ? { ordinal: child } : { inheritedSource: source, ordinal: child })
    }
  }

  const buildings = new Map<string, MutableBuilding>()
  let allocationTraceObjects = 0
  let attributedObjects = 0
  let locationObjects = 0
  let runtimeObjects = 0
  let shallowBytes = 0
  for (let ordinal = 0; ordinal < snapshot.node_count; ordinal++) {
    const selfSize = snapshot.nodes[ordinal * nodeFieldCount + selfSizeOffset]
    shallowBytes += selfSize
    const source = sourceByOrdinal[ordinal]
    const path = source || getRuntimePath(snapshot, ordinal, typeOffset, nodeFieldCount)
    const kind = source ? 'source' : 'runtime'
    if (kind === 'runtime') {
      runtimeObjects++
    } else {
      attributedObjects++
    }
    if (originByOrdinal[ordinal] === 1) {
      allocationTraceObjects++
    } else if (originByOrdinal[ordinal] === 2) {
      locationObjects++
    }
    const building =
      buildings.get(path) ||
      ({
        kind,
        largestObjectRetainedBytes: 0,
        objectCount: 0,
        path,
        retainedBytes: 0,
        shallowBytes: 0,
      } satisfies MutableBuilding)
    building.objectCount++
    building.retainedBytes += selfSize
    building.shallowBytes += selfSize
    building.largestObjectRetainedBytes = Math.max(building.largestObjectRetainedBytes, retainedSizes[ordinal])
    buildings.set(path, building)
  }

  const totals: MemoryCityTotals = {
    allocationTraceObjects,
    attributedObjects,
    locationObjects,
    objectCount: snapshot.node_count,
    retainedBytes: shallowBytes,
    runtimeObjects,
    shallowBytes,
  }
  return {
    buildings: [...buildings.values()].sort(compareBuildings),
    totals,
  }
}

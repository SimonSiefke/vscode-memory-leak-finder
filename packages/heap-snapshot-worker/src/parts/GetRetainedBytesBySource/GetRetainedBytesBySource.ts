import { computeMemoryCityDominators } from '../ComputeMemoryCityDominators/ComputeMemoryCityDominators.ts'
import type { MemoryCityScriptMap } from '../MemoryCityTypes/MemoryCityTypes.ts'
import { resolveMemoryCitySources } from '../ResolveMemoryCitySources/ResolveMemoryCitySources.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

export interface RetainedBytesSource {
  readonly allocationCount: number
  readonly objectCount: number
  readonly retainedBytes: number
  readonly source: string
}

export interface RetainedBytesBySourceReport {
  readonly isLeak: boolean
  readonly sources: readonly RetainedBytesSource[]
  readonly totals: {
    readonly allocationCount: number
    readonly objectCount: number
    readonly retainedBytes: number
  }
}

interface MutableSource {
  allocationCount: number
  objectCount: number
  retainedBytes: number
  source: string
}

const buildDominatorChildren = (dominators: Uint32Array): readonly number[][] => {
  const children = Array.from({ length: dominators.length }, () => [] as number[])
  for (let ordinal = 1; ordinal < dominators.length; ordinal++) {
    children[dominators[ordinal]].push(ordinal)
  }
  return children
}

export const getRetainedBytesBySource = async (
  snapshot: Snapshot,
  scriptMap: MemoryCityScriptMap,
  minimumCount = 1,
): Promise<RetainedBytesBySourceReport> => {
  const { dominators } = computeMemoryCityDominators(snapshot)
  const { allocationSources } = await resolveMemoryCitySources(snapshot, scriptMap)
  const nodeFields = snapshot.meta.node_fields
  const nodeFieldCount = nodeFields.length
  const selfSizeOffset = nodeFields.indexOf('self_size')
  const traceNodeIdOffset = nodeFields.indexOf('trace_node_id')
  const sourceByOrdinal = new Array<string | undefined>(snapshot.node_count)
  const isAllocation = new Uint8Array(snapshot.node_count)
  if (traceNodeIdOffset !== -1) {
    for (let ordinal = 0; ordinal < snapshot.node_count; ordinal++) {
      const traceId = snapshot.nodes[ordinal * nodeFieldCount + traceNodeIdOffset]
      const source = allocationSources.get(traceId)
      if (source) {
        sourceByOrdinal[ordinal] = source
        isAllocation[ordinal] = 1
      }
    }
  }

  const children = buildDominatorChildren(dominators)
  const stack: Array<{ inheritedSource?: string; ordinal: number }> = [{ ordinal: 0 }]
  while (stack.length > 0) {
    const { inheritedSource, ordinal } = stack.pop()!
    const source = sourceByOrdinal[ordinal] || inheritedSource
    if (!sourceByOrdinal[ordinal] && source) {
      sourceByOrdinal[ordinal] = source
    }
    for (const child of children[ordinal]) {
      stack.push(source ? { inheritedSource: source, ordinal: child } : { ordinal: child })
    }
  }

  const sourceMap = new Map<string, MutableSource>()
  for (let ordinal = 0; ordinal < snapshot.node_count; ordinal++) {
    const source = sourceByOrdinal[ordinal]
    if (!source) {
      continue
    }
    const item = sourceMap.get(source) || { allocationCount: 0, objectCount: 0, retainedBytes: 0, source }
    item.allocationCount += isAllocation[ordinal]
    item.objectCount++
    item.retainedBytes += snapshot.nodes[ordinal * nodeFieldCount + selfSizeOffset]
    sourceMap.set(source, item)
  }
  const sources = [...sourceMap.values()]
    .filter((item) => item.allocationCount >= minimumCount)
    .sort((a, b) => b.retainedBytes - a.retainedBytes || a.source.localeCompare(b.source))
  const totals = sources.reduce(
    (result, item) => ({
      allocationCount: result.allocationCount + item.allocationCount,
      objectCount: result.objectCount + item.objectCount,
      retainedBytes: result.retainedBytes + item.retainedBytes,
    }),
    { allocationCount: 0, objectCount: 0, retainedBytes: 0 },
  )
  return { isLeak: sources.length > 0, sources, totals }
}

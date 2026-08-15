import { computeMemoryCityDominators } from '../ComputeMemoryCityDominators/ComputeMemoryCityDominators.ts'
import type { MemoryCityScriptMap } from '../MemoryCityTypes/MemoryCityTypes.ts'
import { resolveMemoryCityAllocationSources } from '../ResolveMemoryCitySources/ResolveMemoryCitySources.ts'
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

export const getRetainedBytesBySource = async (
  snapshot: Snapshot,
  scriptMap: MemoryCityScriptMap,
  minimumCount = 1,
): Promise<RetainedBytesBySourceReport> => {
  const { dominators, postOrder } = computeMemoryCityDominators(snapshot)
  const allocationSources = await resolveMemoryCityAllocationSources(snapshot, scriptMap)
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

  for (let index = postOrder.length - 1; index >= 0; index--) {
    const ordinal = postOrder[index]
    if (!sourceByOrdinal[ordinal] && ordinal !== dominators[ordinal]) {
      sourceByOrdinal[ordinal] = sourceByOrdinal[dominators[ordinal]]
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

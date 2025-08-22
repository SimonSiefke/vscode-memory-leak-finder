import * as Assert from '../Assert/Assert.ts'
import { getFunctionsWithLocations } from '../GetFunctionsWithLocations/GetFunctionsWithLocations.ts'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.ts'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'
import { normalizeFunctionObjects } from '../NormalizeFunctionObjects/NormalizeFunctionObjects.ts'
import { aggregateFunctionObjects } from '../AggregateFunctionObjects/AggregateFunctionObjects.ts'
import type { AggregatedFunction } from '../AggregateFunctionObjects/AggregateFunctionObjects.ts'

export const getNamedFunctionCountFromHeapSnapshot = async (
  id: number,
  scriptMap: Record<number, { readonly url?: string; readonly sourceMapUrl?: string }>,
  minCount: number,
): Promise<readonly AggregatedFunction[]> => {
  const heapsnapshot = HeapSnapshotState.get(id)
  Assert.object(heapsnapshot)
  const { parsedNodes, locations } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const functionsWithLocations = getFunctionsWithLocations(parsedNodes, locations, scriptMap)
  const normalized = normalizeFunctionObjects(functionsWithLocations)
  const aggregated: readonly AggregatedFunction[] = aggregateFunctionObjects(normalized)
  const sorted: readonly AggregatedFunction[] = aggregated.toSorted((a, b) => b.count - a.count)
  const limited: readonly AggregatedFunction[] = sorted.filter((item) => item.count >= minCount)
  return limited
}

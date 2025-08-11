import * as Assert from '../Assert/Assert.ts'
import { getFunctionsWithLocations } from '../GetFunctionsWithLocations/GetFunctionsWithLocations.ts'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.ts'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'
import { normalizeFunctionObjects } from '../NormalizeFunctionObjects/NormalizeFunctionObjects.ts'
import { aggregateFunctionObjects } from '../AggregateFunctionObjects/AggregateFunctionObjects.ts'

export const getNamedFunctionCountFromHeapSnapshot = async (id, scriptMap, minCount) => {
  const heapsnapshot = HeapSnapshotState.get(id)
  Assert.object(heapsnapshot)
  const { parsedNodes, locations } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const functionsWithLocations = getFunctionsWithLocations(parsedNodes, locations, scriptMap)
  const normalized = normalizeFunctionObjects(functionsWithLocations)
  const aggregated = aggregateFunctionObjects(normalized)
  const sorted = aggregated.toSorted((a, b) => b.count - a.count)
  const limited = sorted.filter((item) => item.count >= minCount)
  return limited
}

import * as Assert from '../Assert/Assert.js'
import { getFunctionsWithLocations } from '../GetFunctionsWithLocations/GetFunctionsWithLocations.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.js'
import { normalizeFunctionObjects } from '../NormalizeFunctionObjects/NormalizeFunctionObjects.js'
import { aggregateFunctionObjects } from '../AggregateFunctionObjects/AggregateFunctionObjects.js'

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

import * as Assert from '../Assert/Assert.js'
import { getFunctionsWithLocations } from '../GetFunctionsWithLocations/GetFunctionsWithLocations.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.js'
import { normalizeFunctionObjects } from '../NormalizeFunctionObjects/NormalizeFunctionObjects.js'
import { aggregateFunctionObjects } from '../AggregateFunctionObjects/AggregateFunctionObjects.js'

export const getNamedFunctionCountFromHeapSnapshot = async (id, scriptMap, minCount) => {
  const heapsnapshot = HeapSnapshotState.get(id)
  Assert.object(heapsnapshot)
  console.time('parse')
  const { parsedNodes, locations } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  console.timeEnd('parse')
  console.time('getLocations')
  const functionsWithLocations = getFunctionsWithLocations(parsedNodes, locations, scriptMap)
  console.timeEnd('getLocations')
  console.time('normalize')
  const normalized = normalizeFunctionObjects(functionsWithLocations)
  console.timeEnd('normalize')
  console.time('aggregate')
  const aggregated = aggregateFunctionObjects(normalized)
  console.timeEnd('aggregate')
  console.time('sort')
  const sorted = aggregated.toSorted((a, b) => b.count - a.count)
  const limited = sorted.filter((item) => item.count >= minCount)
  console.timeEnd('sort')
  return limited
}

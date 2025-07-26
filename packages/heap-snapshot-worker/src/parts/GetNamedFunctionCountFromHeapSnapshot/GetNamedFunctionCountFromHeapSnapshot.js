import * as Assert from '../Assert/Assert.js'
import { getFunctionsWithLocations } from '../GetFunctionsWithLocations/GetFunctionsWithLocations.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.js'
import { normalizeFunctionObjects } from '../NormalizeFunctionObjects/NormalizeFunctionObjects.js'
import { aggregateFunctionObjects } from '../AggregateFunctionObjects/AggregateFunctionObjects.js'

export const getNamedFunctionCountFromHeapSnapshot = async (id, scriptMap) => {
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
  console.timeEnd('sort')
  return sorted
}

// const path = join(import.meta.dirname, '../../../../../.vscode-heapsnapshots', '1.json')
// const content = readFileSync(path, 'utf8')
// const parsed = JSON.parse(content)
// const pathScriptMap = join(import.meta.dirname, '../../../../../.vscode-heapsnapshots', 'scriptMap.json')
// const contentScriptMap = readFileSync(pathScriptMap, 'utf8')
// const parsedContentScriptMap = JSON.parse(contentScriptMap)

// const result = await getNamedFunctionCountFromHeapSnapshot(parsed, parsedContentScriptMap)
// writeFileSync('/tmp/parsed-nodes.json', JSON.stringify(result, null, 2) + '\n')

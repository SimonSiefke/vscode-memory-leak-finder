import * as Assert from '../Assert/Assert.js'
import { getFunctionsWithLocations } from '../GetFunctionsWithLocations/GetFunctionsWithLocations.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.js'

const normalizeFunctionObjects = (functionObjects) => {
  const normalized = []
  for (const functionObject of functionObjects) {
    const { url, lineIndex, columnIndex, name, sourceMapUrl } = functionObject
    const displayUrl = `${url}:${lineIndex}:${columnIndex}`
    normalized.push({
      url: displayUrl,
      name,
      sourceMapUrl,
    })
  }
  return normalized
}

const aggregateFunctionObjects = (functionObjects) => {
  const map = Object.create(null)
  for (const { url } of functionObjects) {
    map[url] ||= 0
    map[url]++
  }
  const seen = Object.create(null)
  const aggregated = []
  for (const { url, sourceMapUrl, name } of functionObjects) {
    if (url in seen) {
      continue
    }
    seen[url] = true
    aggregated.push({
      name,
      url,
      sourceMapUrl,
      count: map[url],
    })
  }
  aggregated.sort((a, b) => b.count - a.count)
  return aggregated
}

export const getNamedFunctionCountFromHeapSnapshot = async (id, scriptMap) => {
  const heapsnapshot = HeapSnapshotState.get(id)
  Assert.object(heapsnapshot)
  console.time('parse')
  const { parsedNodes, graph, locations } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
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
  return aggregated
}

// const path = join(import.meta.dirname, '../../../../../.vscode-heapsnapshots', '1.json')
// const content = readFileSync(path, 'utf8')
// const parsed = JSON.parse(content)
// const pathScriptMap = join(import.meta.dirname, '../../../../../.vscode-heapsnapshots', 'scriptMap.json')
// const contentScriptMap = readFileSync(pathScriptMap, 'utf8')
// const parsedContentScriptMap = JSON.parse(contentScriptMap)

// const result = await getNamedFunctionCountFromHeapSnapshot(parsed, parsedContentScriptMap)
// writeFileSync('/tmp/parsed-nodes.json', JSON.stringify(result, null, 2) + '\n')

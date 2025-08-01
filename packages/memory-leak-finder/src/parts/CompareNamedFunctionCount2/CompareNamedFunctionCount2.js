import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.js'

const addSourceLocations = async (functionObjects, scriptMap) => {
  const classNames = true
  const requests = functionObjects.map((item) => {
    const script = scriptMap[item.scriptId]
    const url = `${script.url}:${item.line}:${item.column}`
    return {
      ...item,
      name: 'abc',
      url: url,
      stack: [url],
      sourceMaps: [script.sourceMapUrl],
    }
  })
  const withOriginalStack = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(requests, classNames)
  const normalized = withOriginalStack.map((item) => {
    const { stack, count, originalStack, originalName, name, beforeCount, delta } = item

    return {
      name: originalName || name,
      count,
      delta,
      url: originalStack?.[0] || stack?.[0] || '',
    }
  })
  return normalized
}

export const compareNamedFunctionCount2 = async (beforePath, after) => {
  // TODO ask heapsnapshot worker to compare functions
  // TODO then for the leaked functions, add sourcemap info
  const afterPath = after.heapSnapshotPath
  const scriptMap = after.scriptMap
  console.log({ scriptMap })
  console.time('check')
  const leaked = await HeapSnapshotFunctions.compareHeapSnapshotFunctions(beforePath, afterPath)
  console.timeEnd('check')
  console.time('sourcemap')
  const withSourceLocations = await addSourceLocations(leaked, scriptMap)
  console.timeEnd('sourcemap')
  return withSourceLocations
}

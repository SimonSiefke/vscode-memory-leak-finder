import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.ts'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.ts'

const addSourceLocations = async (functionObjects, scriptMap) => {
  const classNames = true
  const requests = functionObjects.map((item) => {
    const script = scriptMap[item.scriptId]
    const url = `${script.url}:${item.line}:${item.column}`
    return {
      ...item,
      name: 'abc',
      sourceMaps: [script.sourceMapUrl],
      stack: [url],
      url: url,
    }
  })
  const withOriginalStack = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(requests, classNames)
  const normalized = withOriginalStack.map((item) => {
    const { count, delta, name, originalName, originalStack, stack } = item

    return {
      count,
      delta,
      name: originalName || name,
      url: originalStack?.[0] || stack?.[0] || '',
    }
  })
  return normalized
}

export const compareNamedFunctionCount2 = async (beforePath, after, useParallel = true) => {
  // TODO ask heapsnapshot worker to compare functions
  // TODO then for the leaked functions, add sourcemap info
  const afterPath = after.heapSnapshotPath
  const { scriptMap } = after
  console.log({ scriptMap })
  console.time('check')
  const leaked = await HeapSnapshotFunctions.compareHeapSnapshotFunctions(beforePath, afterPath, useParallel)
  console.timeEnd('check')
  console.time('sourcemap')
  const withSourceLocations = await addSourceLocations(leaked, scriptMap)
  console.timeEnd('sourcemap')
  return withSourceLocations
}

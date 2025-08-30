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
      url: url,
      stack: [url],
      sourceMaps: [script.sourceMapUrl],
    }
  })
  const withOriginalStack = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(requests, classNames)
  const normalized = withOriginalStack.map((item) => {
    const { stack, count, originalStack, originalName, name, delta } = item

    return {
      name: originalName || name,
      count,
      delta,
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

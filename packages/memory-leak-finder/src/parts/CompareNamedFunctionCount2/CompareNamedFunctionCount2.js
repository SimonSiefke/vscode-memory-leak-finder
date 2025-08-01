import * as CreateCountMap from '../CreateCountMap/CreateCountMap.js'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.js'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'

const addSourceLocations = async (functionObjects) => {
  const classNames = true
  const requests = functionObjects.map((item) => {
    return {
      ...item,
      stack: [item.url],
      sourceMaps: [item.sourceMapUrl],
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

export const compareNamedFunctionCount2 = async (beforePath, afterPath) => {
  // TODO ask heapsnapshot worker to compare functions
  // TODO then for the leaked functions, add sourcemap info
  // const leaked = mergeFunctions(before, after)
  const leaked = await HeapSnapshotFunctions.compareHeapSnapshotFunctions(beforePath, afterPath)
  const withSourceLocations = await addSourceLocations(leaked)
  return withSourceLocations
}

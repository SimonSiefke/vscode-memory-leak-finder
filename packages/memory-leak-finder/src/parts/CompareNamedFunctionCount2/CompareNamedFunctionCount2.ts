import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.ts'
import * as HeapSnapshotFunctions from '../HeapSnapshotFunctions/HeapSnapshotFunctions.ts'

const addSourceLocations = async (functionObjects: readonly { scriptId: string; line: number; column: number; count: number; delta: number; [key: string]: unknown }[], scriptMap: { [scriptId: string]: { url: string; sourceMapUrl: string } }): Promise<readonly { count: number; delta: number; name: string; url: string }[]> => {
  const classNames = true
  const requests = functionObjects.map((item: { scriptId: string; line: number; column: number; count: number; delta: number; [key: string]: unknown }) => {
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
  const normalized = withOriginalStack.map((item: { count: number; delta: number; name: string; originalName?: string; originalStack?: readonly string[]; stack?: readonly string[] }) => {
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

export const compareNamedFunctionCount2 = async (beforePath: string, after: { heapSnapshotPath: string; scriptMap: { [scriptId: string]: { url: string; sourceMapUrl: string } } }, useParallel = true): Promise<readonly { count: number; delta: number; name: string; url: string }[]> => {
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

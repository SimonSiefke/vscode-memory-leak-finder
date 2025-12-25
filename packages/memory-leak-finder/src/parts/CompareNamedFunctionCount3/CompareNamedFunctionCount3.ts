import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'

const getThreshold = (context: any): number => {
  const defaultRuns = 2
  const threshold = context && Number.isFinite(context.runs) ? context.runs : defaultRuns
  return threshold
}

export const compareNamedFunctionCount3 = async (beforePath: string, afterPath: string, context: any): Promise<readonly any[]> => {
  const threshold = getThreshold(context)
  const options = {
    excludeOriginalPaths: [
      'async.ts',
      'editStack.ts',
      'event.ts',
      'files.ts',
      'functional.ts',
      'lazy.ts',
      'lifecycle.ts',
      'linkedList.ts',
      'numbers.ts',
      'ternarySearchTree.ts',
      'undoRedoService.ts',
      'uri.ts',
      'uriIdentityService.ts',
    ],
    minCount: threshold,
  }
  await using rpc = await launchHeapSnapshotWorker()
  const result = await rpc.invoke('HeapSnapshot.compareFunctions2', beforePath, afterPath, options)
  return result
}

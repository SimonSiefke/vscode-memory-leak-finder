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
      // 'async.ts',
      // 'debugName.ts',
      // 'diffEditorInput.ts',
      // 'editStack.ts',
      // 'event.ts',
      // 'fileEditorInput.ts',
      // 'files.ts',
      // 'functional.ts',
      // 'historyService.ts.ts',
      // 'historyService.ts',
      // 'lazy.ts',
      // 'lifecycle.ts',
      // 'linkedList.ts',
      // 'numbers.ts',
      // 'position.ts',
      // 'ternarySearchTree.ts',
      // 'textResourceEditorInput.ts',
      // 'undoRedoService.ts',
      // 'uri.ts',
      // 'uriIdentityService.ts',
    ],
    minCount: threshold,
  }
  await using rpc = await launchHeapSnapshotWorker()
  const result = await rpc.invoke('HeapSnapshot.compareFunctions2', beforePath, afterPath, options)
  return result
}

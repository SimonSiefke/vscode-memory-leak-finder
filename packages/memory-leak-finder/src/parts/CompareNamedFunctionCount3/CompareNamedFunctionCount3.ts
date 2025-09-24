import * as HeapSnapshotWorker from '../HeapSnapshotWorker/HeapSnapshotWorker.ts'

export const compareNamedFunctionCount3 = async (beforePath: string, afterPath: string, context: any): Promise<readonly any[]> => {
  const defaultRuns = 2
  const threshold = context && Number.isFinite(context.runs) ? context.runs : defaultRuns
  const options = {
    minCount: 320,
    excludeOriginalPaths: [
      // 'async.ts',
      // 'editStack.ts',
      // 'event.ts',
      // 'files.ts',
      // 'functional.ts',
      // 'lazy.ts',
      // 'lifecycle.ts',
      // 'linkedList.ts',
      // 'numbers.ts',
      // 'ternarySearchTree.ts',
      // 'undoRedoService.ts',
      // 'uri.ts',
    ],
  }
  const result = await HeapSnapshotWorker.invoke('HeapSnapshot.compareFunctions2', beforePath, afterPath, options)
  return result
}

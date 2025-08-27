import * as HeapSnapshotWorker from '../HeapSnapshotWorker/HeapSnapshotWorker.ts'

export const compareNamedFunctionCount3 = async (beforePath: string, afterPath: string): Promise<readonly any[]> => {
  const options = {
    minCount: 2,
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
    ],
  }
  const result = await HeapSnapshotWorker.invoke('HeapSnapshot.compareFunctions2', beforePath, afterPath, options)
  return result
}

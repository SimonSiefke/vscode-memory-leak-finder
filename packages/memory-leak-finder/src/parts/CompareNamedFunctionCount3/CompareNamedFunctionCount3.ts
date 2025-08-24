import * as HeapSnapshotWorker from '../HeapSnapshotWorker/HeapSnapshotWorker.ts'

export const compareNamedFunctionCount3 = async (beforePath: string, afterPath: string): Promise<readonly any[]> => {
  const options = {
    minCount: 2,
    excludeOriginalPaths: [
      'editStack.ts',
      'event.ts',
      'functional.ts',
      'lazy.ts',
      'lifecycle.ts',
      'numbers.ts',
      'ternarySearchTree.ts',
      'undoRedoService.ts',
      'uri.ts',
      'async.ts',
      'linkedList.ts',
    ],
  }
  const result = await HeapSnapshotWorker.invoke('HeapSnapshot.compareFunctions2', beforePath, afterPath, options)
  return result
}

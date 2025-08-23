import * as HeapSnapshotWorker from '../HeapSnapshotWorker/HeapSnapshotWorker.ts'

export const compareNamedFunctionCount3 = async (beforePath: string, afterPath: string): Promise<readonly any[]> => {
  const options = {
    minCount: 2,
    excludeOriginalPaths: ['event.ts', 'functional.ts', 'lifecycle.ts', 'uri.ts', 'ternarySearchTree.ts'],
  }
  const result = await HeapSnapshotWorker.invoke('HeapSnapshot.compareFunctions2', beforePath, afterPath, options)
  return result
}

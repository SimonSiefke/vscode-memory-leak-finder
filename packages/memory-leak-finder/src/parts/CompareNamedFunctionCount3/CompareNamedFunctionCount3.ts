import * as HeapSnapshotWorker from '../HeapSnapshotWorker/HeapSnapshotWorker.ts'

export const compareNamedFunctionCount3 = async (beforePath: string, afterPath: string, _session?: any, _objectGroup?: any, _scriptHandler?: any, context?: any): Promise<readonly any[]> => {
  const threshold = context && Number.isFinite(context.runs) ? context.runs : 2
  const options = {
    minCount: threshold,
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
    ],
  }
  const result = await HeapSnapshotWorker.invoke('HeapSnapshot.compareFunctions2', beforePath, afterPath, options)
  return result
}

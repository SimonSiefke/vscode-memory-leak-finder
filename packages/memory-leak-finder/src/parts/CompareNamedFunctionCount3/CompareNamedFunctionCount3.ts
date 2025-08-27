import * as HeapSnapshotWorker from '../HeapSnapshotWorker/HeapSnapshotWorker.ts'

export const compareNamedFunctionCount3 = async (
  beforePath: string,
  afterPath: string,
  _session?: any,
  _objectGroup?: any,
  _scriptHandler?: any,
  context?: any,
): Promise<readonly any[]> => {
  const threshold = context && Number.isFinite(context.runs) ? context.runs : 2
  const options = {
    minCount: threshold,
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

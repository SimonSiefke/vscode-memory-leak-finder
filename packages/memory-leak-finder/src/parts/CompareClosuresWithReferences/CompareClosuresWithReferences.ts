import * as HeapSnapshotWorker from '../HeapSnapshotWorker/HeapSnapshotWorker.ts'

export const compareClosuresWithReferences = async (beforePath: string, after: { heapSnapshotPath: string }) => {
  const afterPath = after.heapSnapshotPath
  const result = await HeapSnapshotWorker.invoke(
    'HeapSnapshot.compareNamedClosureCountWithReferences2',
    beforePath,
    afterPath,
  )
  return result
}


import * as HeapSnapshotWorker from '../HeapSnapshotWorker/HeapSnapshotWorker.ts'

const getThreshold = (context: any): number => {
  const defaultRuns = 2
  const threshold = context && Number.isFinite(context.runs) ? context.runs : defaultRuns
  return threshold
}

export const compareClosuresWithReferences = async (beforePath: string, after: { heapSnapshotPath: string }, context: any) => {
  const afterPath = after.heapSnapshotPath
  const minCount = getThreshold(context)
  const result = await HeapSnapshotWorker.invoke('HeapSnapshot.compareNamedClosureCountWithReferences2', beforePath, afterPath, minCount)
  return result
}

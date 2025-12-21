import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'

const getThreshold = (context: any): number => {
  const defaultRuns = 2
  const threshold = context && Number.isFinite(context.runs) ? context.runs : defaultRuns
  return threshold
}

export const compareClosuresWithReferences = async (beforePath: string, after: { heapSnapshotPath: string }, context: any) => {
  const afterPath = after.heapSnapshotPath
  const minCount = getThreshold(context)
  const options = {
    minCount,
  }
  await using rpc = await launchHeapSnapshotWorker()
  const result = await rpc.invoke('HeapSnapshot.compareNamedClosureCountWithReferences2', beforePath, afterPath, options)
  return result
}

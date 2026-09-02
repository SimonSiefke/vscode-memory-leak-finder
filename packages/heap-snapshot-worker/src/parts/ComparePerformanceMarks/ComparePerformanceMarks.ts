import { getPerformanceMarkMetrics, type PerformanceMarkMetrics } from '../GetPerformanceMarkMetrics/GetPerformanceMarkMetrics.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export interface PerformanceMarkComparison {
  readonly after: PerformanceMarkMetrics
  readonly before: PerformanceMarkMetrics
  readonly delta: PerformanceMarkMetrics
}

export const comparePerformanceMarks = async (beforePath: string, afterPath: string): Promise<PerformanceMarkComparison> => {
  const [beforeSnapshot, afterSnapshot] = await Promise.all([
    prepareHeapSnapshot(beforePath, { parseStrings: true }),
    prepareHeapSnapshot(afterPath, { parseStrings: true }),
  ])
  const before = getPerformanceMarkMetrics(beforeSnapshot)
  const after = getPerformanceMarkMetrics(afterSnapshot)
  const delta = {
    bytes: after.bytes - before.bytes,
    count: after.count - before.count,
  }
  return { after, before, delta }
}

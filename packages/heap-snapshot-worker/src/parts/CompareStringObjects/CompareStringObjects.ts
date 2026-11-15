import { getStringObjectMetrics, type StringObjectMetrics } from '../GetStringObjectMetrics/GetStringObjectMetrics.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export interface StringObjectComparison {
  readonly after: StringObjectMetrics
  readonly before: StringObjectMetrics
  readonly delta: StringObjectMetrics
}

export const compareStringObjects = async (beforePath: string, afterPath: string): Promise<StringObjectComparison> => {
  const [beforeSnapshot, afterSnapshot] = await Promise.all([
    prepareHeapSnapshot(beforePath, { parseStrings: false }),
    prepareHeapSnapshot(afterPath, { parseStrings: false }),
  ])
  const before = getStringObjectMetrics(beforeSnapshot)
  const after = getStringObjectMetrics(afterSnapshot)
  const delta = {
    bytes: after.bytes - before.bytes,
    count: after.count - before.count,
  }
  return { after, before, delta }
}

import { getConcatenatedErrorStringCountsFromHeapSnapshot } from '../GetConcatenatedErrorStringCountsFromHeapSnapshot/GetConcatenatedErrorStringCountsFromHeapSnapshot.ts'

export interface ConcatenatedErrorStringCountComparison {
  readonly after: number
  readonly before: number
  readonly delta: number
  readonly totalAfter: number
  readonly totalBefore: number
  readonly totalDelta: number
}

export const compareConcatenatedErrorStringCount = async (
  beforePath: string,
  afterPath: string,
): Promise<ConcatenatedErrorStringCountComparison> => {
  const [before, after] = await Promise.all([
    getConcatenatedErrorStringCountsFromHeapSnapshot(beforePath),
    getConcatenatedErrorStringCountsFromHeapSnapshot(afterPath),
  ])
  return {
    after: after.count,
    before: before.count,
    delta: after.count - before.count,
    totalAfter: after.total,
    totalBefore: before.total,
    totalDelta: after.total - before.total,
  }
}

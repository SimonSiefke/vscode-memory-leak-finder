import { getConcatenatedStringsFromHeapSnapshot } from '../GetConcatenatedStringsFromHeapSnapshot/GetConcatenatedStringsFromHeapSnapshot.ts'

export interface ConcatenatedStringsComparison {
  readonly after: readonly string[]
  readonly before: readonly string[]
}

export const compareConcatenatedStrings = async (beforePath: string, afterPath: string): Promise<ConcatenatedStringsComparison> => {
  const [before, after] = await Promise.all([
    getConcatenatedStringsFromHeapSnapshot(beforePath),
    getConcatenatedStringsFromHeapSnapshot(afterPath),
  ])
  return {
    after,
    before,
  }
}

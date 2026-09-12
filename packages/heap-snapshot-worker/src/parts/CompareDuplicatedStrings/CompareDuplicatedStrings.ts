import { getDuplicatedStringsFromHeapSnapshot } from '../GetDuplicatedStringsFromHeapSnapshot/GetDuplicatedStringsFromHeapSnapshot.ts'

export interface DuplicatedStringsComparison {
  readonly after: readonly string[]
  readonly before: readonly string[]
}

export const compareDuplicatedStrings = async (beforePath: string, afterPath: string): Promise<DuplicatedStringsComparison> => {
  const [before, after] = await Promise.all([
    getDuplicatedStringsFromHeapSnapshot(beforePath),
    getDuplicatedStringsFromHeapSnapshot(afterPath),
  ])
  return {
    after,
    before,
  }
}

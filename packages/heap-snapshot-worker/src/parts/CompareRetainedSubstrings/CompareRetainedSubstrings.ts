import { getRetainedSubstrings } from '../GetRetainedSubstrings/GetRetainedSubstrings.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

const analyze = async (path: string) => getRetainedSubstrings(await prepareHeapSnapshot(path, { parseStrings: true }))

export const compareRetainedSubstrings = async (beforePath: string, afterPath: string) => {
  // Keep only the bounded report before parsing the next large snapshot.
  const before = await analyze(beforePath)
  const after = await analyze(afterPath)
  const delta = after.exclusivelyRetainedBytes - before.exclusivelyRetainedBytes
  return { before, after, delta, isLeak: delta > 0 }
}

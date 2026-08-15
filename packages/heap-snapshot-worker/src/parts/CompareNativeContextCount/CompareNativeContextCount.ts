import { getNativeContextCount } from '../GetNativeContextCount/GetNativeContextCount.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export interface NativeContextCountComparison {
  readonly after: number
  readonly before: number
  readonly delta: number
  readonly isLeak: boolean
}

export const compareNativeContextCount = async (beforePath: string, afterPath: string): Promise<NativeContextCountComparison> => {
  const [beforeSnapshot, afterSnapshot] = await Promise.all([prepareHeapSnapshot(beforePath, {}), prepareHeapSnapshot(afterPath, {})])
  const before = getNativeContextCount(beforeSnapshot)
  const after = getNativeContextCount(afterSnapshot)
  const delta = after - before
  return { after, before, delta, isLeak: delta > 0 }
}

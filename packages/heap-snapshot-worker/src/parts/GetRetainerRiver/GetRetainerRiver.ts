import { getRetainerRiverAnalysis } from '../GetRetainerRiverAnalysis/GetRetainerRiverAnalysis.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getRetainerRiver = async (beforePath: string, afterPath: string, minimumCount: number) => {
  const [before, after] = await Promise.all([
    prepareHeapSnapshot(beforePath, { parseStrings: true }),
    prepareHeapSnapshot(afterPath, { parseStrings: true }),
  ])
  return getRetainerRiverAnalysis(before, after, { minimumCount })
}

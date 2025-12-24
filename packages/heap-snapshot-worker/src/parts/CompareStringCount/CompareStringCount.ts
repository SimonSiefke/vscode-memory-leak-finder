import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const compareStringCount = async (beforePath: string, afterPath: string): Promise<{ beforeCount: number; afterCount: number }> => {
  const [snapshotBefore, snapshotAfter] = await Promise.all([
    prepareHeapSnapshot(beforePath, {
      parseStrings: true,
    }),
    prepareHeapSnapshot(afterPath, {
      parseStrings: true,
    }),
  ])

  const beforeCount = snapshotBefore.strings.length
  const afterCount = snapshotAfter.strings.length

  return {
    beforeCount,
    afterCount,
  }
}

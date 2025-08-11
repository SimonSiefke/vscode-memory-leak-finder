import { getTextDecoderCountFromHeapSnapshotInternal } from '../GetTextDecoderCountFromHeapSnapshotInternal/GetTextDecoderCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getTextDecoderCountFromHeapSnapshot = async (path: string): Promise<number> => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getTextDecoderCountFromHeapSnapshotInternal(snapshot)
}

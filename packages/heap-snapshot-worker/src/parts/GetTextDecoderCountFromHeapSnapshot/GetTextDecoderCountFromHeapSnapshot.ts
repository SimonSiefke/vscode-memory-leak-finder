import { getTextDecoderCountFromHeapSnapshotInternal } from '../GetTextDecoderCountFromHeapSnapshotInternal/GetTextDecoderCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getTextDecoderCountFromHeapSnapshot = async (path: string): Promise<number> => {
  // @ts-ignore minimal typing for migration
  const snapshot: any = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getTextDecoderCountFromHeapSnapshotInternal(snapshot)
}

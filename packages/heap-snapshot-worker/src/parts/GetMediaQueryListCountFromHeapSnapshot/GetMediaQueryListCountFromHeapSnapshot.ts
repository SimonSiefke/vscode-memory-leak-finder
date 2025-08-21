import { getMediaQueryListCountFromHeapSnapshotInternal } from '../GetMediaQueryListCountFromHeapSnapshotInternal/GetMediaQueryListCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getMediaQueryListCountFromHeapSnapshot = async (path: string): Promise<number> => {
  // @ts-ignore minimal typing for migration
  const snapshot: any = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getMediaQueryListCountFromHeapSnapshotInternal(snapshot)
}

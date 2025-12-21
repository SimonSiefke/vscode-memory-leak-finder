import { getWeakRefCountFromHeapSnapshotInternal } from '../GetWeakRefCountFromHeapSnapshotInternal/GetWeakRefCountFromHeapSnapshotInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getWeakRefCountFromHeapSnapshot = async (path: string): Promise<number> => {
  // @ts-ignore minimal typing for migration
  const snapshot: any = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getWeakRefCountFromHeapSnapshotInternal(snapshot)
}

import { getHeapSnapshotObjectCountInternal } from '../GetHeapSnapshotObjectCountInternal/GetHeapSnapshotObjectCountInternal.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const getHeapSnapshotObjectCount = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getHeapSnapshotObjectCountInternal(snapshot)
}

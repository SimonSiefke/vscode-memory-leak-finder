import { getHeapSnapshotObjectCountInternal } from '../GetHeapSnapshotObjectCountInternal/GetHeapSnapshotObjectCountInternal.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'

export const getHeapSnapshotObjectCount = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  return getHeapSnapshotObjectCountInternal(snapshot)
}

import { getTypeCount } from '../GetTypeCount/GetTypeCount.ts'
import { Snapshot } from '../Snapshot/Snapshot.ts'

export const getHeapSnapshotObjectCountInternal = (snapshot: Snapshot): number => {
  const numberCount = getTypeCount(snapshot, 'number')
  const nativeCount = getTypeCount(snapshot, 'native')

  return numberCount + nativeCount
}

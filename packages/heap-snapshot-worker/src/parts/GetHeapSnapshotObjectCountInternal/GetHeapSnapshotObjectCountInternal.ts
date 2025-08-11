import { getTypeCount } from '../GetTypeCount/GetTypeCount.ts'

/**
 *
 * @param {any} snapshot
 * @returns {number}
 */
export const getHeapSnapshotObjectCountInternal = (snapshot) => {
  const numberCount = getTypeCount(snapshot, 'number')
  const nativeCount = getTypeCount(snapshot, 'native')

  return numberCount + nativeCount
}

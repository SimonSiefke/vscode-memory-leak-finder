import { getTypeCount } from '../GetTypeCount/GetTypeCount.js'

export const getRegexCountFromHeapSnapshotInternal = async (snapshot) => {
  return getTypeCount(snapshot, 'regexp')
}

import { getTypeCount } from '../GetTypeCount/GetTypeCount.js'

export const getRegexObjectsFromHeapSnapshot = async (path) => {
  return getTypeCount(path, 'regexp')
}

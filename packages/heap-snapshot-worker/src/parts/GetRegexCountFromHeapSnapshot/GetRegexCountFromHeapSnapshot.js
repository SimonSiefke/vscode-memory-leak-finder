import { getTypeCount } from '../GetTypeCount/GetTypeCount.js'

export const getRegexCountFromHeapSnapshot = async (path) => {
  return getTypeCount(path, 'regexp')
}

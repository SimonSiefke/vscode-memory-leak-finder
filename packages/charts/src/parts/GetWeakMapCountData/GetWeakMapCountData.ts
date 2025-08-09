import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getWeakMapCountData = () => {
  return GetCountData.getCountData('weak-map-count', 'weakMapCount')
}

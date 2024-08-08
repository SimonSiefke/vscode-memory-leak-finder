import * as GetCountData from '../GetCountData/GetCountData.js'

export const getWeakMapCountData = () => {
  return GetCountData.getCountData('weak-map-count', 'weakMapCount')
}

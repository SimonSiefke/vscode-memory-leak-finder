import * as GetCountData from '../GetCountData/GetCountData.js'

export const getWeakSetCountData = () => {
  return GetCountData.getCountData('weak-map-count', 'weakMapCount')
}

import * as GetCountData from '../GetCountData/GetCountData.js'

export const getObjectCountsData = () => {
  return GetCountData.getCountData('object-count', 'objectCount')
}

import * as GetCountData from '../GetCountData/GetCountData.js'

export const getNumberCountsData = () => {
  return GetCountData.getCountData('number-count', 'numberCount')
}

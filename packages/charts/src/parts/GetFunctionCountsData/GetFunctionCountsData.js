import * as GetCountData from '../GetCountData/GetCountData.js'

export const getFunctionCountsData = () => {
  return GetCountData.getCountData('function-count', 'functionCount')
}

import * as GetCountData from '../GetCountData/GetCountData.js'

export const getErrorCountData = () => {
  return GetCountData.getCountData('error-count', 'errorCount')
}

import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getErrorCountData = () => {
  return GetCountData.getCountData('error-count', 'errorCount')
}

import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getFunctionCountsData = () => {
  return GetCountData.getCountData('function-count', 'functionCount')
}

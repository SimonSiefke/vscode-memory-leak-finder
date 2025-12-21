import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getFunctionCountsData = (basePath: string) => {
  return GetCountData.getCountData('function-count', 'functionCount', basePath)
}

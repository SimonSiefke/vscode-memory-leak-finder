import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getErrorCountData = (basePath: string) => {
  return GetCountData.getCountData('error-count', 'errorCount', basePath)
}

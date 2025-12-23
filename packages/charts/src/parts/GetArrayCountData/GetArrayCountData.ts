import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getArrayCountData = (basePath: string) => {
  return GetCountData.getCountData('array-count', 'arrayCount', basePath)
}

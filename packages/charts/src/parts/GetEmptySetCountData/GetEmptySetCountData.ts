import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getEmptySetCountData = (basePath: string) => {
  return GetCountData.getCountData('empty-set-count', 'emptySetCount', basePath)
}

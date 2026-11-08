import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getEmptyMapCountData = (basePath: string) => {
  return GetCountData.getCountData('empty-map-count', 'emptyMapCount', basePath)
}

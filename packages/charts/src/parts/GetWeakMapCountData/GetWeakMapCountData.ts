import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getWeakMapCountData = (basePath: string) => {
  return GetCountData.getCountData('weak-map-count', 'weakMapCount', basePath)
}

import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getObjectCountsData = (basePath: string) => {
  return GetCountData.getCountData('object-count', 'objectCount', basePath)
}

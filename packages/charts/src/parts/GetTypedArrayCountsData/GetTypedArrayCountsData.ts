import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getTypedArrayCountsData = (basePath: string) => {
  return GetCountData.getCountData('typed-array-count', 'typedArrayCount', basePath)
}

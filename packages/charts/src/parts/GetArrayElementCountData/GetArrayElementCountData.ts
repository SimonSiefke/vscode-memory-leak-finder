import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getArrayElementCountData = (basePath: string) => {
  return GetCountData.getCountData('array-element-count', 'arrayElementCount', basePath)
}

import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getWeakSetCountData = (basePath: string) => {
  return GetCountData.getCountData('weak-set-count', 'weakSetCount', basePath)
}

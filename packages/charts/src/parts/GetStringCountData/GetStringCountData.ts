import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getStringCountData = (basePath: string) => {
  return GetCountData.getCountData('string-count', 'stringCount', basePath)
}

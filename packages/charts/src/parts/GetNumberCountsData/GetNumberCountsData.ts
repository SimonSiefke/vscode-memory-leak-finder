import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getNumberCountsData = (basePath: string) => {
  return GetCountData.getCountData('number-count', 'numberCount', basePath)
}

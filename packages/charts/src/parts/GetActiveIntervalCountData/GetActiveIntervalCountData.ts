import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getActiveIntervalCountData = (basePath: string) => {
  return GetCountData.getCountData('active-interval-count', 'activeIntervalCount', basePath)
}

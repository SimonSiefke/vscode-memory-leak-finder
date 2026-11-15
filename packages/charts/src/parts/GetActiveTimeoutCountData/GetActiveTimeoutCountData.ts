import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getActiveTimeoutCountData = (basePath: string) => {
  return GetCountData.getCountData('active-timeout-count', 'activeTimeoutCount', basePath)
}

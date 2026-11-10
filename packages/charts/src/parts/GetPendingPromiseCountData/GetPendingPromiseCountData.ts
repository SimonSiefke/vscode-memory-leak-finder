import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getPendingPromiseCountData = (basePath: string) => {
  return GetCountData.getCountData('pending-promise-count', 'pendingPromiseCount', basePath)
}

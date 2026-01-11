import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getWorkerCountData = (basePath: string) => {
  return GetCountData.getCountData('worker-count', 'workerCount', basePath)
}

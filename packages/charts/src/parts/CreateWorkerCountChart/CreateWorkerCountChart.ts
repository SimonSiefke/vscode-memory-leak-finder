import * as GetWorkerCountData from '../GetWorkerCountData/GetWorkerCountData.ts'

export const name = 'worker-count'

export const getData = (basePath: string) => GetWorkerCountData.getWorkerCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Worker Count',
  }
}

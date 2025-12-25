import * as GetWorkerCountData from '../GetWorkerCountData/GetWorkerCountData.ts'

export const name = 'worker-count'

export const getData = (basePath: string): Promise<any[]> => GetWorkerCountData.getWorkerCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Worker Count',
  }
}

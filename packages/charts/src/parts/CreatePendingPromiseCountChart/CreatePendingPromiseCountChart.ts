import * as GetPendingPromiseCountData from '../GetPendingPromiseCountData/GetPendingPromiseCountData.ts'

export const name = 'pending-promise-count'

export const getData = (basePath: string): Promise<any[]> => GetPendingPromiseCountData.getPendingPromiseCountData(basePath)

export const createChart = () => ({
  x: 'index',
  xLabel: 'Index',
  y: 'count',
  yLabel: 'Pending Promise Count',
})

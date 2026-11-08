import * as GetActiveTimeoutCountData from '../GetActiveTimeoutCountData/GetActiveTimeoutCountData.ts'

export const name = 'active-timeout-count'

export const getData = (basePath: string): Promise<any[]> => GetActiveTimeoutCountData.getActiveTimeoutCountData(basePath)

export const createChart = () => ({
  x: 'index',
  xLabel: 'Index',
  y: 'count',
  yLabel: 'Active Timeout Count',
})

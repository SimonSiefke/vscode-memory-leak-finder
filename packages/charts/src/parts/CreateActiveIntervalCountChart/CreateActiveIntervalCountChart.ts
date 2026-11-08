import * as GetActiveIntervalCountData from '../GetActiveIntervalCountData/GetActiveIntervalCountData.ts'

export const name = 'active-interval-count'

export const getData = (basePath: string): Promise<any[]> => GetActiveIntervalCountData.getActiveIntervalCountData(basePath)

export const createChart = () => ({
  x: 'index',
  xLabel: 'Index',
  y: 'count',
  yLabel: 'Active Interval Count',
})

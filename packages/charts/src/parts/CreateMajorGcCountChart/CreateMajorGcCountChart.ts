import { getGcCountData } from '../GetGcCountData/GetGcCountData.ts'

export const name = 'major-gc-count'
export const getData = (basePath: string) => getGcCountData(basePath, 'majorGCs')

export const createChart = () => ({
  x: 'index',
  xLabel: 'Index',
  y: 'count',
  yLabel: 'Major GC Count',
})

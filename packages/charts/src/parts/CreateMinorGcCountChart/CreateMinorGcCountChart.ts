import { getGcCountData } from '../GetGcCountData/GetGcCountData.ts'

export const name = 'minor-gc-count'
export const getData = (basePath: string) => getGcCountData(basePath, 'minorGCs')

export const createChart = () => ({
  x: 'index',
  xLabel: 'Index',
  y: 'count',
  yLabel: 'Minor GC Count',
})

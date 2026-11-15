import * as GetEmptyMapCountData from '../GetEmptyMapCountData/GetEmptyMapCountData.ts'

export const name = 'empty-map-count'

export const getData = (basePath: string): Promise<any[]> => GetEmptyMapCountData.getEmptyMapCountData(basePath)

export const createChart = () => ({
  x: 'index',
  xLabel: 'Index',
  y: 'count',
  yLabel: 'Empty Map Count',
})

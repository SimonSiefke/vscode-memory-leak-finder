import * as GetEmptySetCountData from '../GetEmptySetCountData/GetEmptySetCountData.ts'

export const name = 'empty-set-count'

export const getData = (basePath: string): Promise<any[]> => GetEmptySetCountData.getEmptySetCountData(basePath)

export const createChart = () => ({
  x: 'index',
  xLabel: 'Index',
  y: 'count',
  yLabel: 'Empty Set Count',
})

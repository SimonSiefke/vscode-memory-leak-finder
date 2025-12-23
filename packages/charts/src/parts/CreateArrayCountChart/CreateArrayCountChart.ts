import * as GetArrayCountData from '../GetArrayCountData/GetArrayCountData.ts'

export const name = 'array-count'

export const getData = (basePath: string) => GetArrayCountData.getArrayCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Array Count',
  }
}

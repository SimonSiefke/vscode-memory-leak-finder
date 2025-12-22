import * as GetErrorCountData from '../GetErrorCountData/GetErrorCountData.ts'

export const name = 'error-count'

export const getData = (basePath: string) => GetErrorCountData.getErrorCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Error Count',
  }
}

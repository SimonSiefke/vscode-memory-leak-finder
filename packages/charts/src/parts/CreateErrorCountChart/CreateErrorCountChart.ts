import * as GetErrorCountData from '../GetErrorCountData/GetErrorCountData.ts'

export const name = 'error-count'

export const getData = GetErrorCountData.getErrorCountData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Error Count',
  }
}

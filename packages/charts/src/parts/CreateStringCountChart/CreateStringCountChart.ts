import * as GetStringCountData from '../GetStringCountData/GetStringCountData.ts'

export const name = 'string-count'

export const getData = (basePath: string) => GetStringCountData.getStringCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'String Count',
  }
}

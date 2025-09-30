import * as GetPromiseCountData from '../GetPromiseCountData/GetPromiseCountData.ts'

export const name = 'promise-count'

export const getData = (basePath: string) => GetPromiseCountData.getPromiseCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Promise Count',
  }
}

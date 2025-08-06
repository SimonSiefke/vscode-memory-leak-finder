import * as GetPromiseCountData from '../GetPromiseCountData/GetPromiseCountData.js'

export const name = 'promise-count'

export const getData = GetPromiseCountData.getPromiseCountData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Promise Count',
  }
}

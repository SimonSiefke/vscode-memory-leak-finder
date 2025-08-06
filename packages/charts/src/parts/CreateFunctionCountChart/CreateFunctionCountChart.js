import * as GetFunctionCountsData from '../GetFunctionCountsData/GetFunctionCountsData.js'

export const name = 'function-count'

export const getData = GetFunctionCountsData.getFunctionCountsData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Function Count',
  }
}

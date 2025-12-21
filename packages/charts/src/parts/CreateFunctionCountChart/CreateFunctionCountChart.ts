import * as GetFunctionCountsData from '../GetFunctionCountsData/GetFunctionCountsData.ts'

export const name = 'function-count'

export const getData = (basePath: string) => GetFunctionCountsData.getFunctionCountsData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Function Count',
  }
}

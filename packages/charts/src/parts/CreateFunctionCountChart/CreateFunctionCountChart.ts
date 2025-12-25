import * as GetFunctionCountsData from '../GetFunctionCountsData/GetFunctionCountsData.ts'

export const name = 'function-count'

export const getData = (basePath: string): Promise<any[]> => GetFunctionCountsData.getFunctionCountsData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Function Count',
  }
}

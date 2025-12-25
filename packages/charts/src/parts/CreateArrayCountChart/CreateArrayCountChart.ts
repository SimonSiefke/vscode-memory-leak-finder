import * as GetArrayCountData from '../GetArrayCountData/GetArrayCountData.ts'

export const name = 'array-count'

export const getData = (basePath: string): Promise<any[]> => GetArrayCountData.getArrayCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Array Count',
  }
}

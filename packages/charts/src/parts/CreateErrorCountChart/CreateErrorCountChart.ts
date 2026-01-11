import * as GetErrorCountData from '../GetErrorCountData/GetErrorCountData.ts'

export const name = 'error-count'

export const getData = (basePath: string): Promise<any[]> => GetErrorCountData.getErrorCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Error Count',
  }
}

import * as GetStringCountData from '../GetStringCountData/GetStringCountData.ts'

export const name = 'string-count'

export const getData = (basePath: string): Promise<any[]> => GetStringCountData.getStringCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'String Count',
  }
}

import * as GetPromiseCountData from '../GetPromiseCountData/GetPromiseCountData.ts'

export const name = 'promise-count'

export const getData = (basePath: string): Promise<any[]> => GetPromiseCountData.getPromiseCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Promise Count',
  }
}

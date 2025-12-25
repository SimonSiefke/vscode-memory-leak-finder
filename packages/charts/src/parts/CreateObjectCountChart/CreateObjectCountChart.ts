import * as GetObjectCountsData from '../GetObjectCountsData/GetObjectCountsData.ts'

export const name = 'object-count'

export const getData = (basePath: string): Promise<any[]> => GetObjectCountsData.getObjectCountsData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Object Count',
  }
}

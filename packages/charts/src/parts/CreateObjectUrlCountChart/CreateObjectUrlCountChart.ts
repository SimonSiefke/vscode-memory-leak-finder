import * as GetObjectUrlCountData from '../GetObjectUrlCountData/GetObjectUrlCountData.ts'

export const name = 'object-url-count'

export const getData = (basePath: string): Promise<any[]> => GetObjectUrlCountData.getObjectUrlCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Frontend Test',
    y: 'count',
    yLabel: 'Active Object URLs',
  }
}

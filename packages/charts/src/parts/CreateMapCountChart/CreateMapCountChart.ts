import * as GetMapCountData from '../GetMapCountData/GetMapCountData.ts'

export const name = 'map-count'

export const getData = (basePath: string): Promise<any[]> => GetMapCountData.getMapCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Map Count',
  }
}

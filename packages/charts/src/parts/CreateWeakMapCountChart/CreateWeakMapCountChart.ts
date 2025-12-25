import * as GetWeakMapCountData from '../GetWeakMapCountData/GetWeakMapCountData.ts'

export const name = 'weak-map-count'

export const getData = (basePath: string): Promise<any[]> => GetWeakMapCountData.getWeakMapCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Weak Map Count',
  }
}

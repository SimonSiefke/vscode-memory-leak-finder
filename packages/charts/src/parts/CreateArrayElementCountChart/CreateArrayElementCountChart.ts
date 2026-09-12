import * as GetArrayElementCountData from '../GetArrayElementCountData/GetArrayElementCountData.ts'

export const name = 'array-element-count'

export const getData = (basePath: string): Promise<any[]> => GetArrayElementCountData.getArrayElementCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Total Array Length',
  }
}

import * as GetTypedArrayCountsData from '../GetTypedArrayCountsData/GetTypedArrayCountsData.ts'

export const name = 'typed-array-count'

export const getData = (basePath: string): Promise<any[]> => GetTypedArrayCountsData.getTypedArrayCountsData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Typed Array Count',
  }
}

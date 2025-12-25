import * as GetWeakRefCountData from '../GetWeakRefCountData/GetWeakRefCountData.ts'

export const name = 'weak-ref-count'

export const getData = (basePath: string): Promise<any[]> => GetWeakRefCountData.getWeakRefCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Weak Ref Count',
  }
}

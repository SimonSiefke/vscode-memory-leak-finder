import * as GetWeakSetCountData from '../GetWeakSetCountData/GetWeakSetCountData.ts'

export const name = 'weak-set-count'

export const getData = (basePath: string): Promise<any[]> => GetWeakSetCountData.getWeakSetCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Weak Set Count',
  }
}

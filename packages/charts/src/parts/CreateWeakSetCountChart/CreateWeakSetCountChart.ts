import * as GetWeakSetCountData from '../GetWeakSetCountData/GetWeakSetCountData.ts'

export const name = 'weak-set-count'

export const getData = (basePath: string) => GetWeakSetCountData.getWeakSetCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Weak Set Count',
  }
}

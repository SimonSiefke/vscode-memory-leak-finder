import * as GetWeakRefCountData from '../GetWeakRefCountData/GetWeakRefCountData.ts'

export const name = 'weak-ref-count'

export const getData = (basePath: string) => GetWeakRefCountData.getWeakRefCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Weak Ref Count',
  }
}


import * as GetWeakMapCountData from '../GetWeakMapCountData/GetWeakMapCountData.ts'

export const name = 'weak-map-count'

export const getData = (basePath: string) => GetWeakMapCountData.getWeakMapCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Weak Map Count',
  }
}

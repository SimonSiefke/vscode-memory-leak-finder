import * as GetWeakMapCountData from '../GetWeakMapCountData/GetWeakMapCountData.ts'

export const name = 'weak-map-count'

export const getData = (basePath: string) => GetWeakMapCountData.getWeakMapCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Weak Map Count',
  }
}

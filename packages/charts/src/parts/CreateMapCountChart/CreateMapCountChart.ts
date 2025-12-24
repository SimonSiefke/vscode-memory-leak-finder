import * as GetMapCountData from '../GetMapCountData/GetMapCountData.ts'

export const name = 'map-count'

export const getData = (basePath: string) => GetMapCountData.getMapCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Map Count',
  }
}

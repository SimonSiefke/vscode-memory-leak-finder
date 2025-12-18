import * as GetMapSizeData from '../GetMapSizeData/GetMapSizeData.ts'

export const name = 'map-size'

export const getData = (basePath: string) => GetMapSizeData.getMapSizeData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Map Size',
  }
}

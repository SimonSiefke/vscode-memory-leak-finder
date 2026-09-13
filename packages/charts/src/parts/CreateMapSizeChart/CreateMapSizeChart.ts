import * as GetMapSizeData from '../GetMapSizeData/GetMapSizeData.ts'

export const name = 'map-size'
export const multiple = true

export const getData = (basePath: string) => GetMapSizeData.getMapSizeData(basePath)

export const createChart = () => {
  return {
    fontSize: 12,
    marginLeft: 140,
    marginRight: 60,
    type: 'bar-chart',
    width: 800,
  }
}

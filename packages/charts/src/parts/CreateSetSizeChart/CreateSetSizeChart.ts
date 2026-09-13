import * as GetSetSizeData from '../GetSetSizeData/GetSetSizeData.ts'

export const name = 'set-size'
export const multiple = true

export const getData = (basePath: string) => GetSetSizeData.getSetSizeData(basePath)

export const createChart = () => {
  return {
    fontSize: 12,
    marginLeft: 140,
    marginRight: 60,
    type: 'bar-chart',
    width: 800,
  }
}

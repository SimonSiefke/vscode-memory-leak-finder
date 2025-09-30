import * as GetSetSizeData from '../GetSetSizeData/GetSetSizeData.ts'

export const name = 'map-size'

export const getData = (basePath: string) => GetSetSizeData.getSetSizeData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Set Size',
  }
}

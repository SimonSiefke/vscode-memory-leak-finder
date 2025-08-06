import * as GetSetSizeData from '../GetSetSizeData/GetSetSizeData.js'

export const name = 'map-size'

export const getData = GetSetSizeData.getSetSizeData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Set Size',
  }
}

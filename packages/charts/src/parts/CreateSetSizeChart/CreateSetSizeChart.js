import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetSetSizeData from '../GetSetSizeData/GetSetSizeData.js'

export const name = 'map-size'

export const getData = GetSetSizeData.getSetSizeData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Set Size',
  })
}

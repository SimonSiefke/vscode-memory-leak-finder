import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetMapSizeData from '../GetMapSizeData/GetMapSizeData.js'

export const name = 'map-size'

export const getData = GetMapSizeData.getMapSizeData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Map Size',
  })
}

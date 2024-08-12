import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetCanvasCountsData from '../GetCanvasCountsData/GetCanvasCountsData.js'

export const name = 'map-size'

export const getData = GetCanvasCountsData.getCanvasCountsData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Map Size',
  })
}

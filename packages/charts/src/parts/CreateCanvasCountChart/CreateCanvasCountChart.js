import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetCanvasCountsData from '../GetCanvasCountsData/GetCanvasCountsData.js'

export const name = 'canvas-count'

export const getData = GetCanvasCountsData.getCanvasCountsData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Canvas Count',
  })
}

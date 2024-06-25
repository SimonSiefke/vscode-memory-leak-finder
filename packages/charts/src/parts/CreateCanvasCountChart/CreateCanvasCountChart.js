import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetCanvasCountsData from '../GetCanvasCountsData/GetCanvasCountsData.js'

export const name = 'canvas-count'

export const createChart = async () => {
  const data = await GetCanvasCountsData.getCanvasCountsData()
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Canvas Count',
  })
}

import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetErrorCountData from '../GetErrorCountData/GetErrorCountData.js'

export const name = 'error-count'

export const getData = GetErrorCountData.getErrorCountData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Error Count',
  })
}

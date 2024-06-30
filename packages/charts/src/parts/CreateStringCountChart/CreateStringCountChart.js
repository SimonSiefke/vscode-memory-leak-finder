import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetStringCountData from '../GetStringCountData/GetStringCountData.js'

export const name = 'string-count'

export const getData = GetStringCountData.getStringCountData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'String Count',
  })
}

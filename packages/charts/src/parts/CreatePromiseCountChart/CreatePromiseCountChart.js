import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetPromiseCountData from '../GetPromiseCountData/GetPromiseCountData.js'

export const name = 'promise-count'

export const getData = GetPromiseCountData.getPromiseCountData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Promise Count',
  })
}

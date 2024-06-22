import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetPromiseCountData from '../GetPromiseCountData/GetPromiseCountData.js'

export const name = 'promise-count'

export const createChart = async () => {
  const data = await GetPromiseCountData.getPromiseCountData()
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Promise Count',
  })
}

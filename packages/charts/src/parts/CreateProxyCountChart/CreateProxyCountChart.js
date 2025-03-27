import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetProxyCountData from '../GetProxyCountData/GetProxyCountData.js'

export const name = 'proxy-count'

export const getData = GetProxyCountData.getProxyCountData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Proxy Count',
  })
}

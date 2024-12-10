import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetSymbolCountsData from '../GetSymbolCountsData/GetSymbolCountsData.js'

export const name = 'symbol-count'

export const getData = GetSymbolCountsData.getSymbolCountsData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Symbol Count',
  })
}

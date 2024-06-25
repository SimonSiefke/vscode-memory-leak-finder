import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetFunctionCountsData from '../GetFunctionCountsData/GetFunctionCountsData.js'

export const name = 'function-count'

export const getData = GetFunctionCountsData.getFunctionCountsData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Function Count',
  })
}

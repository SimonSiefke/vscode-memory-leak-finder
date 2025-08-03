import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetAbortSignalCountData from '../GetAbortSignalCountData/GetAbortSignalCountData.js'

export const getData = GetAbortSignalCountData.getAbortSignalCountData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'AbortSignal Count',
  })
}
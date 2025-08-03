import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetAbortControllerCountData from '../GetAbortControllerCountData/GetAbortControllerCountData.js'

export const getData = GetAbortControllerCountData.getAbortControllerCountData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'AbortController Count',
  })
}
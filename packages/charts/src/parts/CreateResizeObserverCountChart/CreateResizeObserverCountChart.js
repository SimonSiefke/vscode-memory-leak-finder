import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetResizeObserverCountData from '../GetResizeObserverCountData/GetResizeObserverCountData.js'

export const name = 'resize-observer-count'

export const getData = GetResizeObserverCountData.getObjectCountsData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Resize Observer Count',
  })
}

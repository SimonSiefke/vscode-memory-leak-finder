import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetDetachedDomNodeCountData from '../GetDetachedDomNodeCountData/GetDetachedDomNodeCountData.js'

export const name = 'detached-dom-node-count'

export const getData = GetDetachedDomNodeCountData.getDetachedDomNodeCountData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Detached Dom Node Count',
  })
}

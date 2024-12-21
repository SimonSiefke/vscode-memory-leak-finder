import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetAttachedDomNodeCountData from '../GetAttachedDomNodeCountData/GetAttachedDomNodeCountData.js'

export const name = 'attached-dom-node-count'

export const getData = GetAttachedDomNodeCountData.getAttachedDomNodeCountData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Attached Dom Node Count',
  })
}

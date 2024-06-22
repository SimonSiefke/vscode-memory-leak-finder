import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetDetachedDomNodeCountData from '../GetDetachedDomNodeCountData/GetDetachedDomNodeCountData.js'

export const name = 'detached-dom-node-count'

export const createChart = async () => {
  const data = await GetDetachedDomNodeCountData.getDetachedDomNodeCountData()
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Detached Dom Node Count',
  })
}

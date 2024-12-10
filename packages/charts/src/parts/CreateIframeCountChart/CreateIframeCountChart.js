import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetIframeCountsData from '../GetIframeCountsData/GetIframeCountsData.js'

export const name = 'iframe-count'

export const getData = GetIframeCountsData.getIframeCountsData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Iframe Count',
  })
}

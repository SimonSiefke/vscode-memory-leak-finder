import * as GetIframeCountsData from '../GetIframeCountsData/GetIframeCountsData.js'

export const name = 'iframe-count'

export const getData = GetIframeCountsData.getIframeCountsData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Iframe Count',
  }
}

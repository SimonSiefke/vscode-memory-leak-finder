import * as GetIframeCountsData from '../GetIframeCountsData/GetIframeCountsData.ts'

export const name = 'iframe-count'

export const getData = (basePath: string) => GetIframeCountsData.getIframeCountsData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Iframe Count',
  }
}

import * as GetIframeCountsData from '../GetIframeCountsData/GetIframeCountsData.ts'

export const name = 'iframe-count'

export const getData = (basePath: string): Promise<any[]> => GetIframeCountsData.getIframeCountsData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Iframe Count',
  }
}

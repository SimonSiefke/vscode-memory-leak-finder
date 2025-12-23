import * as GetMediaQueryListCountData from '../GetMediaQueryListCountData/GetMediaQueryListCountData.ts'

export const name = 'media-query-list-count'

export const getData = (basePath: string) => GetMediaQueryListCountData.getMediaQueryListCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Media Query List Count',
  }
}

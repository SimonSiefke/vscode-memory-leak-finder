import * as GetMediaQueryListCountData from '../GetMediaQueryListCountData/GetMediaQueryListCountData.ts'

export const name = 'media-query-list-count'

export const getData = (basePath: string): Promise<any[]> => GetMediaQueryListCountData.getMediaQueryListCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Media Query List Count',
  }
}

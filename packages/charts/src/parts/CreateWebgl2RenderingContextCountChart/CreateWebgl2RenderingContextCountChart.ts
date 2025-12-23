import * as GetWebgl2RenderingContextCountsData from '../GetWebgl2RenderingContextCountsData/GetWebgl2RenderingContextCountsData.ts'

export const name = 'webgl2-rendering-context-count'

export const getData = (basePath: string) => GetWebgl2RenderingContextCountsData.getWebgl2RenderingContextCountsData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'WebGL2 Rendering Context Count',
  }
}

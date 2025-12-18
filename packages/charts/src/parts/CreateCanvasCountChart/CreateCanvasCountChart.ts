import * as GetCanvasCountsData from '../GetCanvasCountsData/GetCanvasCountsData.ts'

export const name = 'canvas-count'

export const getData = (basePath: string) => GetCanvasCountsData.getCanvasCountsData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Canvas Count',
  }
}

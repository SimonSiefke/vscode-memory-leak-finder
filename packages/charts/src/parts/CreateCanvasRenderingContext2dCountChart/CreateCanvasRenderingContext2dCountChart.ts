import * as GetCanvasRenderingContext2dCountsData from '../GetCanvasRenderingContext2dCountsData/GetCanvasRenderingContext2dCountsData.ts'

export const name = 'canvas-rendering-context-2d-count'

export const getData = (basePath: string) => GetCanvasRenderingContext2dCountsData.getCanvasRenderingContext2dCountsData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Canvas Rendering Context 2D Count',
  }
}

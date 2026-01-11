import * as GetCanvasCountsData from '../GetCanvasCountsData/GetCanvasCountsData.ts'

export const name = 'canvas-count'

export const getData = (basePath: string): Promise<any[]> => GetCanvasCountsData.getCanvasCountsData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Canvas Count',
  }
}

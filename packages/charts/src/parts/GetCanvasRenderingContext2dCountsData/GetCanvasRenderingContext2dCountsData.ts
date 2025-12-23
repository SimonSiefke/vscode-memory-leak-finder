import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getCanvasRenderingContext2dCountsData = (basePath: string) => {
  return GetCountData.getCountData('canvas-rendering-context-2d-count', 'canvasRenderingContext2dCount', basePath)
}


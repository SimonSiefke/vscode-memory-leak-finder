import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getCanvasCountsData = (basePath: string) => {
  return GetCountData.getCountData('canvas-count', 'canvasCount', basePath)
}

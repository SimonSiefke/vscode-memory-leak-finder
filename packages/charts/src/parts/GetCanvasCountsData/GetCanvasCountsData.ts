import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getCanvasCountsData = () => {
  return GetCountData.getCountData('canvas-count', 'canvasCount')
}

import * as GetCountData from '../GetCountData/GetCountData.js'

export const getCanvasCountsData = () => {
  return GetCountData.getCountData('canvas-count', 'canvasCount')
}

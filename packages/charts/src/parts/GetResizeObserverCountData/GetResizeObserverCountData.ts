import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getResizeObserverCountData = (basePath: string) => {
  return GetCountData.getCountData('resize-observer-count', 'resizeObserverCount', basePath)
}

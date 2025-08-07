import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getObjectCountsData = () => {
  return GetCountData.getCountData('resize-observer-count', 'resizeObserverCount')
}

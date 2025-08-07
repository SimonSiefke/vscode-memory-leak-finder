import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getObjectCountsData = () => {
  return GetCountData.getCountData('mutation-observer-count', 'mutationObserverCount')
}

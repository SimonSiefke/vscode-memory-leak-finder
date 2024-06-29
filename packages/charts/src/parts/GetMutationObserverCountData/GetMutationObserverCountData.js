import * as GetCountData from '../GetCountData/GetCountData.js'

export const getObjectCountsData = () => {
  return GetCountData.getCountData('mutation-observer-count', 'mutationObserverCount')
}

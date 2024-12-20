import * as GetCountData from '../GetCountData/GetCountData.js'

export const getAttachedDomNodeCountData = () => {
  return GetCountData.getCountData('attached-dom-node-count', 'attachedDomNodeCount')
}

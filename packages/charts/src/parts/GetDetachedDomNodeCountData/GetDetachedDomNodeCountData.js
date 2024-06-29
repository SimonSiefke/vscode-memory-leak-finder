import * as GetCountData from '../GetCountData/GetCountData.js'

export const getDetachedDomNodeCountData = () => {
  return GetCountData.getCountData('detached-dom-node-count', 'detachedDomNodeCount')
}

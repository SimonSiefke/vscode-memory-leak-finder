import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getDetachedDomNodeCountData = () => {
  return GetCountData.getCountData('detached-dom-node-count', 'detachedDomNodeCount')
}

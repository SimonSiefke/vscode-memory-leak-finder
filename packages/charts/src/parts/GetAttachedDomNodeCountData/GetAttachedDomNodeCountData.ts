import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getAttachedDomNodeCountData = () => {
  return GetCountData.getCountData('attached-dom-node-count', 'attachedDomNodeCount')
}

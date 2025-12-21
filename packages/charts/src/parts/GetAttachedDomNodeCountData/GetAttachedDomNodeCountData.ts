import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getAttachedDomNodeCountData = (basePath: string) => {
  return GetCountData.getCountData('attached-dom-node-count', 'attachedDomNodeCount', basePath)
}

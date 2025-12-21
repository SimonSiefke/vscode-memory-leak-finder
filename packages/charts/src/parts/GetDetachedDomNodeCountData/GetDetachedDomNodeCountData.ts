import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getDetachedDomNodeCountData = (basePath: string) => {
  return GetCountData.getCountData('detached-dom-node-count', 'detachedDomNodeCount', basePath)
}

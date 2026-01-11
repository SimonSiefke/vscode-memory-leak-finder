import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getProxyCountData = (basePath: string) => {
  return GetCountData.getCountData('proxy-count', 'proxyCount', basePath)
}

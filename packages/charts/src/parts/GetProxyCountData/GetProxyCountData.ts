import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getProxyCountData = () => {
  return GetCountData.getCountData('proxy-count', 'proxyCount')
}

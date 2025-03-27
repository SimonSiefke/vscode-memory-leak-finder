import * as GetCountData from '../GetCountData/GetCountData.js'

export const getProxyCountData = () => {
  return GetCountData.getCountData('proxy-count', 'proxyCount')
}

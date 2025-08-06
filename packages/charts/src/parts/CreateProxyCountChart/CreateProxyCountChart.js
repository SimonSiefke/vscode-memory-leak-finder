import * as GetProxyCountData from '../GetProxyCountData/GetProxyCountData.js'

export const name = 'proxy-count'

export const getData = GetProxyCountData.getProxyCountData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Proxy Count',
  }
}

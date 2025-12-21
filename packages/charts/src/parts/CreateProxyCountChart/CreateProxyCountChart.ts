import * as GetProxyCountData from '../GetProxyCountData/GetProxyCountData.ts'

export const name = 'proxy-count'

export const getData = (basePath: string) => GetProxyCountData.getProxyCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Proxy Count',
  }
}

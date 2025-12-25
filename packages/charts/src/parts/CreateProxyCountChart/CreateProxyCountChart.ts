import * as GetProxyCountData from '../GetProxyCountData/GetProxyCountData.ts'

export const name = 'proxy-count'

export const getData = (basePath: string): Promise<any[]> => GetProxyCountData.getProxyCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Proxy Count',
  }
}

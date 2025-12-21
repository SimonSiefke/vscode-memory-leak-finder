import * as GetDetachedDomNodeCountData from '../GetDetachedDomNodeCountData/GetDetachedDomNodeCountData.ts'

export const name = 'detached-dom-node-count'

export const getData = (basePath: string) => GetDetachedDomNodeCountData.getDetachedDomNodeCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Detached Dom Node Count',
  }
}

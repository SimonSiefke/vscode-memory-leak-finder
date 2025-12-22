import * as GetDetachedDomNodeCountData from '../GetDetachedDomNodeCountData/GetDetachedDomNodeCountData.ts'

export const name = 'detached-dom-node-count'

export const getData = (basePath: string) => GetDetachedDomNodeCountData.getDetachedDomNodeCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Detached Dom Node Count',
  }
}

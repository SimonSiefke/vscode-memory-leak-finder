import * as GetDetachedDomNodeCountData from '../GetDetachedDomNodeCountData/GetDetachedDomNodeCountData.js'

export const name = 'detached-dom-node-count'

export const getData = GetDetachedDomNodeCountData.getDetachedDomNodeCountData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Detached Dom Node Count',
  }
}

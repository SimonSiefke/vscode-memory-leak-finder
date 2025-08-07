import * as GetAttachedDomNodeCountData from '../GetAttachedDomNodeCountData/GetAttachedDomNodeCountData.ts'

export const name = 'attached-dom-node-count'

export const getData = GetAttachedDomNodeCountData.getAttachedDomNodeCountData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Attached Dom Node Count',
  }
}

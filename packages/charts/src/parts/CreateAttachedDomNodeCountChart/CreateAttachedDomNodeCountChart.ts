import * as GetAttachedDomNodeCountData from '../GetAttachedDomNodeCountData/GetAttachedDomNodeCountData.ts'

export const name = 'attached-dom-node-count'

export const getData = (basePath: string): Promise<any[]> => GetAttachedDomNodeCountData.getAttachedDomNodeCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Attached Dom Node Count',
  }
}

import * as GetDetachedDomNodeCountData from '../GetDetachedDomNodeCountData/GetDetachedDomNodeCountData.ts'

export const name = 'detached-dom-node-count'

export const getData = (basePath: string): Promise<any[]> => GetDetachedDomNodeCountData.getDetachedDomNodeCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Detached Dom Node Count',
  }
}

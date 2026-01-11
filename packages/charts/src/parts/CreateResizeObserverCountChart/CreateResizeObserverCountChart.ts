import * as GetResizeObserverCountData from '../GetResizeObserverCountData/GetResizeObserverCountData.ts'

export const name = 'resize-observer-count'

export const getData = (basePath: string): Promise<any[]> => GetResizeObserverCountData.getResizeObserverCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Resize Observer Count',
  }
}

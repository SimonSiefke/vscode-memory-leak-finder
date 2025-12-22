import * as GetResizeObserverCountData from '../GetResizeObserverCountData/GetResizeObserverCountData.ts'

export const name = 'resize-observer-count'

export const getData = (basePath: string) => GetResizeObserverCountData.getResizeObserverCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Resize Observer Count',
  }
}

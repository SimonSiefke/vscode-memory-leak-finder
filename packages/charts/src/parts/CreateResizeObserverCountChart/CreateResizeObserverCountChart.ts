import * as GetResizeObserverCountData from '../GetResizeObserverCountData/GetResizeObserverCountData.ts'

export const name = 'resize-observer-count'

export const getData = GetResizeObserverCountData.getObjectCountsData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Resize Observer Count',
  }
}

import * as GetIntersectionObserverCountData from '../GetIntersectionObserverCountData/GetIntersectionObserverCountData.ts'

export const name = 'intersection-observer-count'

export const getData = (basePath: string): Promise<any[]> => GetIntersectionObserverCountData.getIntersectionObserverCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Intersection Observer Count',
  }
}


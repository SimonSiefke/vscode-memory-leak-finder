import * as GetIntersectionObserverCountData from '../GetIntersectionObserverCountData/GetIntersectionObserverCountData.ts'

export const name = 'intersection-observer-count'

export const getData = (basePath: string) => GetIntersectionObserverCountData.getIntersectionObserverCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Intersection Observer Count',
  }
}


import * as GetMutationObserverCountData from '../GetMutationObserverCountData/GetMutationObserverCountData.ts'

export const name = 'mutation-observer-count'

export const getData = (basePath: string) => GetMutationObserverCountData.getMutationObserverCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Mutation Observer Count',
  }
}

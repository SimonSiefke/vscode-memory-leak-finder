import * as GetMutationObserverCountData from '../GetMutationObserverCountData/GetMutationObserverCountData.ts'

export const name = 'mutation-observer-count'

export const getData = (basePath: string): Promise<any[]> => GetMutationObserverCountData.getMutationObserverCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Mutation Observer Count',
  }
}

import * as GetAbortControllerCountData from '../GetAbortControllerCountData/GetAbortControllerCountData.ts'

export const name = 'abort-controller-count'

export const getData = (basePath: string): Promise<any[]> => GetAbortControllerCountData.getAbortControllerCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'AbortController Count',
  }
}

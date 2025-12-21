import * as GetAbortSignalCountData from '../GetAbortSignalCountData/GetAbortSignalCountData.ts'

export const name = 'abort-signal-count'

export const getData = (basePath: string) => GetAbortSignalCountData.getAbortSignalCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'AbortSignal Count',
  }
}

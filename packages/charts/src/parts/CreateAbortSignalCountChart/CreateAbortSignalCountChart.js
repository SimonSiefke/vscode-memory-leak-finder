import * as GetAbortSignalCountData from '../GetAbortSignalCountData/GetAbortSignalCountData.js'

export const name = 'abort-signal-count'

export const getData = GetAbortSignalCountData.getAbortSignalCountData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'AbortSignal Count',
  }
}

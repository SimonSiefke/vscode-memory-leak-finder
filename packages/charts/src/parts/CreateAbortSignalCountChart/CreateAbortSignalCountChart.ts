import * as GetAbortSignalCountData from '../GetAbortSignalCountData/GetAbortSignalCountData.ts'

export const name = 'abort-signal-count'

export const getData = (basePath: string): Promise<any[]> => GetAbortSignalCountData.getAbortSignalCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'AbortSignal Count',
  }
}

import * as GetDomTimerCountData from '../GetDomTimerCountData/GetDomTimerCountData.ts'

export const name = 'dom-timer-count'

export const getData = (basePath: string): Promise<any[]> => GetDomTimerCountData.getDomTimerCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'DOM Timer Count',
  }
}

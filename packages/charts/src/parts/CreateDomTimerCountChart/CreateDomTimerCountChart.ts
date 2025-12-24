import * as GetDomTimerCountData from '../GetDomTimerCountData/GetDomTimerCountData.ts'

export const name = 'dom-timer-count'

export const getData = (basePath: string) => GetDomTimerCountData.getDomTimerCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'DOM Timer Count',
  }
}

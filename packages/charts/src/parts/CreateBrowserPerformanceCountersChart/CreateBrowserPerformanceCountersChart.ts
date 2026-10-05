import * as GetBrowserPerformanceCountersData from '../GetBrowserPerformanceCountersData/GetBrowserPerformanceCountersData.ts'

export const name = 'browser-performance-counters'

export const getData = (basePath: string): Promise<any[]> => {
  return GetBrowserPerformanceCountersData.getBrowserPerformanceCountersData(basePath)
}

export const createChart = (): {
  fontSize: number
  marginLeft: number
  marginRight: number
  type: string
  width: number
  x: string
  xLabel: string
  y: string
  yLabel: string
} => {
  return {
    fontSize: 12,
    marginLeft: 260,
    marginRight: 220,
    type: 'bar-chart',
    width: 900,
    x: 'value',
    xLabel: 'Delta',
    y: 'name',
    yLabel: 'Browser Performance Counter Deltas',
  }
}

export const multiple = true

import * as GetFrontendStartupPerformanceData from '../GetFrontendStartupPerformanceData/GetFrontendStartupPerformanceData.ts'

export const name = 'frontend-startup-performance'

export const getData = (basePath: string): Promise<any[]> => {
  return GetFrontendStartupPerformanceData.getFrontendStartupPerformanceData(basePath)
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
    marginLeft: 70,
    marginRight: 40,
    type: 'line-chart',
    width: 900,
    x: 'runIndex',
    xLabel: 'Run',
    y: 'value',
    yLabel: 'loadEventEnd (ms)',
  }
}

export const multiple = true

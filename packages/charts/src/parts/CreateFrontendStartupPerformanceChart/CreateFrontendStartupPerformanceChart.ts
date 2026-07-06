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
    marginLeft: 260,
    marginRight: 220,
    type: 'bar-chart',
    width: 900,
    x: 'value',
    xLabel: 'Median (ms)',
    y: 'name',
    yLabel: 'Frontend Startup Performance',
  }
}

export const multiple = true

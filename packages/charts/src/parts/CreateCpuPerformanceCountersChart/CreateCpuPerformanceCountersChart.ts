import * as GetCpuPerformanceCountersData from '../GetCpuPerformanceCountersData/GetCpuPerformanceCountersData.ts'

export const name = 'cpu-performance-counters'

export const getData = (basePath: string): Promise<any[]> => {
  return GetCpuPerformanceCountersData.getCpuPerformanceCountersData(basePath)
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
    marginLeft: 160,
    marginRight: 220,
    type: 'bar-chart',
    width: 900,
    x: 'value',
    xLabel: 'Count',
    y: 'name',
    yLabel: 'CPU Performance Counters',
  }
}

export const multiple = true

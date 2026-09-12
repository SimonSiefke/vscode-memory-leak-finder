import * as GetPerformanceMarkCountsData from '../GetPerformanceMarkCountsData/GetPerformanceMarkCountsData.ts'

export const name = 'performance-mark-counts'
export const multiple = true

export const getData = (basePath: string): Promise<any[]> => GetPerformanceMarkCountsData.getPerformanceMarkCountsData(basePath)

export const createChart = () => {
  return {
    fontSize: 12,
    marginLeft: 180,
    marginRight: 180,
    type: 'dual-bar-chart',
    width: 900,
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'PerformanceMark Count',
  }
}

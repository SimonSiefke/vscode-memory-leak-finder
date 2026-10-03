import * as GetPerformanceMarkBytesData from '../GetPerformanceMarkBytesData/GetPerformanceMarkBytesData.ts'

export const name = 'performance-mark-bytes'
export const multiple = true

export const getData = (basePath: string): Promise<any[]> => GetPerformanceMarkBytesData.getPerformanceMarkBytesData(basePath)

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
    yLabel: 'PerformanceMark Bytes',
  }
}

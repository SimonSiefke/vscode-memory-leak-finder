import * as GetPerformanceMarkData from '../GetPerformanceMarkData/GetPerformanceMarkData.ts'

export const getPerformanceMarkCountsData = (basePath: string) => {
  return GetPerformanceMarkData.getPerformanceMarkData('performance-mark-counts', 'performanceMarkCounts', basePath)
}

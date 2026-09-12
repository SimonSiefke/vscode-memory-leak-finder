import * as GetPerformanceMarkData from '../GetPerformanceMarkData/GetPerformanceMarkData.ts'

export const getPerformanceMarkBytesData = (basePath: string) => {
  return GetPerformanceMarkData.getPerformanceMarkData('performance-mark-bytes', 'performanceMarkBytes', basePath)
}

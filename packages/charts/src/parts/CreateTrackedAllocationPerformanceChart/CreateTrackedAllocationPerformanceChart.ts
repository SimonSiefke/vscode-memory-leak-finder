import * as GetTrackedAllocationPerformanceData from '../GetTrackedAllocationPerformanceData/GetTrackedAllocationPerformanceData.ts'

export const name = 'tracked-allocation-performance'

export const getData = (basePath: string): Promise<any[]> =>
  GetTrackedAllocationPerformanceData.getTrackedAllocationPerformanceData(basePath)

export const createChart = () => {
  return {
    fontSize: 12,
    marginLeft: 500,
    marginRight: 80,
    type: 'allocation-performance-chart',
    width: 1600,
  }
}

export const multiple = true

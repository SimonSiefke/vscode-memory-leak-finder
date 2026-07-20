import * as GetTrackedAllocationLeaksData from '../GetTrackedAllocationLeaksData/GetTrackedAllocationLeaksData.ts'

export const name = 'tracked-allocation-leaks'

export const getData = (basePath: string): Promise<any[]> => GetTrackedAllocationLeaksData.getTrackedAllocationLeaksData(basePath)

export const createChart = () => {
  return {
    fontSize: 12,
    marginLeft: 500,
    marginRight: 100,
    type: 'dual-bar-chart',
    width: 1400,
    x: 'value',
    xLabel: 'Allocation Count',
    y: 'name',
    yLabel: 'Potential Leak Site',
  }
}

export const multiple = true

import * as GetTrackedAllocationsData from '../GetTrackedAllocationsData/GetTrackedAllocationsData.ts'

export const name = 'tracked-allocations'

export const getData = (basePath: string): Promise<any[]> => GetTrackedAllocationsData.getTrackedAllocationsData(basePath)

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
    marginRight: 50,
    type: 'dual-bar-chart',
    width: 1200,
    x: 'value',
    xLabel: 'Allocation Count',
    y: 'name',
    yLabel: 'Allocation Site',
  }
}

export const multiple = true

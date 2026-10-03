import * as GetTrackedAllocationsByFileData from '../GetTrackedAllocationsByFileData/GetTrackedAllocationsByFileData.ts'

export const name = 'tracked-allocations-by-file'

export const getData = (basePath: string): Promise<any[]> => GetTrackedAllocationsByFileData.getTrackedAllocationsByFileData(basePath)

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
    marginLeft: 500,
    marginRight: 200,
    type: 'grouped-horizontal-bar-chart',
    width: 1400,
    x: 'value',
    xLabel: 'Allocation Count',
    y: 'name',
    yLabel: 'Source File',
  }
}

export const multiple = true

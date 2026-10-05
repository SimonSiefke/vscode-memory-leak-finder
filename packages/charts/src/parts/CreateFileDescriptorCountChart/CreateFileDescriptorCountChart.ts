import * as GetFileDescriptorCountData from '../GetFileDescriptorCountData/GetFileDescriptorCountData.ts'

export const name = 'file-descriptor-count'

export const getData = (basePath: string): Promise<any[]> => GetFileDescriptorCountData.getFileDescriptorCountData(basePath)

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
    marginRight: 500,
    type: 'dual-bar-chart',
    width: 1400,
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'File Descriptor Counts',
  }
}

export const multiple = true

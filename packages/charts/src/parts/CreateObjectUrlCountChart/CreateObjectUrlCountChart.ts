import * as GetObjectUrlCountData from '../GetObjectUrlCountData/GetObjectUrlCountData.ts'

export const name = 'object-url-count'
export const multiple = true

export const getData = (basePath: string): Promise<any[]> => GetObjectUrlCountData.getObjectUrlCountData(basePath)

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
    yLabel: 'Object URLs',
  }
}

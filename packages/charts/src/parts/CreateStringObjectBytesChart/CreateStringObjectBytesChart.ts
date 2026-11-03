import { getStringObjectData } from '../GetStringObjectData/GetStringObjectData.ts'

export const name = 'string-object-bytes'
export const multiple = true

export const getData = (basePath: string) => getStringObjectData(name, 'stringObjectBytes', basePath)

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
    yLabel: 'String Object Bytes',
  }
}

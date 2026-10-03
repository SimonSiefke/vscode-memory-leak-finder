import * as GetArrayBufferBytesData from '../GetArrayBufferBytesData/GetArrayBufferBytesData.ts'

export const name = 'array-buffer-bytes'
export const multiple = true

export const getData = (basePath: string) => GetArrayBufferBytesData.getArrayBufferBytesData(basePath)

export const createChart = () => {
  return {
    fontSize: 12,
    marginLeft: 180,
    marginRight: 60,
    type: 'bar-chart',
    width: 800,
  }
}

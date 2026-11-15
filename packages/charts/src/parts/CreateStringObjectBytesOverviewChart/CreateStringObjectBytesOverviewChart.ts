import { getCountData } from '../GetCountData/GetCountData.ts'

export const name = 'string-object-bytes'

export const getData = (basePath: string) => getCountData(name, 'stringObjectBytes', basePath)

export const createChart = () => ({
  marginLeft: 90,
  x: 'index',
  xLabel: 'Test Case Index',
  y: 'count',
  yLabel: 'String Object Size (bytes)',
})

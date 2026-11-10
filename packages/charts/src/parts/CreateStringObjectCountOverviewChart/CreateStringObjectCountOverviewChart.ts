import { getCountData } from '../GetCountData/GetCountData.ts'

export const name = 'string-object-count'

export const getData = (basePath: string) => getCountData(name, 'stringObjectCount', basePath)

export const createChart = () => ({
  x: 'index',
  xLabel: 'Test Case Index',
  y: 'count',
  yLabel: 'String Object Count',
})

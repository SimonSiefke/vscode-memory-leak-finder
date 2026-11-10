import * as GetObjectShapeCountData from '../GetObjectShapeCountData/GetObjectShapeCountData.ts'

export const name = 'object-shape-count'

export const getData = (basePath: string): Promise<any[]> => GetObjectShapeCountData.getObjectShapeCountData(basePath)

export const createChart = () => ({
  x: 'index',
  xLabel: 'Index',
  y: 'count',
  yLabel: 'Object Shape Count',
})

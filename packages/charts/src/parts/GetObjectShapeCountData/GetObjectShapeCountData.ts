import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getObjectShapeCountData = (basePath: string) => {
  return GetCountData.getCountData('object-shape-count', 'objectShapeCount', basePath)
}

import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getWeakRefCountData = (basePath: string) => {
  return GetCountData.getCountData('weak-ref-count', 'weakRefCount', basePath)
}

import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getIntersectionObserverCountData = (basePath: string) => {
  return GetCountData.getCountData('intersection-observer-count', 'intersectionObserverCount', basePath)
}

import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getMutationObserverCountData = (basePath: string) => {
  return GetCountData.getCountData('mutation-observer-count', 'mutationObserverCount', basePath)
}

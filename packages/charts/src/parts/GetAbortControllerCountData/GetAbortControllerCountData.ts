import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getAbortControllerCountData = (basePath: string) => {
  return GetCountData.getCountData('abort-controller-count', 'abortControllerCount', basePath)
}

import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getAbortControllerCountData = () => {
  return GetCountData.getCountData('abort-controller-count', 'abortControllerCount')
}

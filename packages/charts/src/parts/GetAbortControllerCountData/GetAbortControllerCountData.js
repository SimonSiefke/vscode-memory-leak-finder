import * as GetCountData from '../GetCountData/GetCountData.js'

export const getAbortControllerCountData = () => {
  return GetCountData.getCountData('abort-controller-count', 'abortControllerCount')
}
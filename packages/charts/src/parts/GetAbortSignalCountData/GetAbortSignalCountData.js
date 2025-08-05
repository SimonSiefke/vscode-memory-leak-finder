import * as GetCountData from '../GetCountData/GetCountData.js'

export const getAbortSignalCountData = () => {
  return GetCountData.getCountData('abort-signal-count', 'abortSignalCount')
}

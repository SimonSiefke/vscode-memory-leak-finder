import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getAbortSignalCountData = () => {
  return GetCountData.getCountData('abort-signal-count', 'abortSignalCount')
}

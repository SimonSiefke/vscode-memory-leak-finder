import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getAbortSignalCountData = (basePath: string) => {
  return GetCountData.getCountData('abort-signal-count', 'abortSignalCount', basePath)
}

import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getDomTimerCountData = (basePath: string) => {
  return GetCountData.getCountData('dom-timer-count', 'domTimerCount', basePath)
}

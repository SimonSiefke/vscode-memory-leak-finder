import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getMessagePortCountsData = (basePath: string) => {
  return GetCountData.getCountData('message-port-count', 'messagePortCount', basePath)
}

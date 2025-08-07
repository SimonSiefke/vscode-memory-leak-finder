import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getMessagePortCountsData = () => {
  return GetCountData.getCountData('message-port-count', 'messagePortCount')
}

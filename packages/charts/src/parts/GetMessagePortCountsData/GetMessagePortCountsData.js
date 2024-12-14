import * as GetCountData from '../GetCountData/GetCountData.js'

export const getMessagePortCountsData = () => {
  return GetCountData.getCountData('message-port-count', 'messagePortCount')
}

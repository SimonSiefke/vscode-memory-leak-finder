import * as GetMessagePortCountsData from '../GetMessagePortCountsData/GetMessagePortCountsData.ts'

export const name = 'message-port-count'

export const getData = GetMessagePortCountsData.getMessagePortCountsData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'MessagePort Count',
  }
}

import * as GetMessagePortCountsData from '../GetMessagePortCountsData/GetMessagePortCountsData.ts'

export const name = 'message-port-count'

export const getData = (basePath: string) => GetMessagePortCountsData.getMessagePortCountsData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'MessagePort Count',
  }
}

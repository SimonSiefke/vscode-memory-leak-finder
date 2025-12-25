import * as GetMessagePortCountsData from '../GetMessagePortCountsData/GetMessagePortCountsData.ts'

export const name = 'message-port-count'

export const getData = (basePath: string): Promise<any[]> => GetMessagePortCountsData.getMessagePortCountsData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'MessagePort Count',
  }
}

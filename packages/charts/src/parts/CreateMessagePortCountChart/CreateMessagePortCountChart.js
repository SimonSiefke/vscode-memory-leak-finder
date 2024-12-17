import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetMessagePortCountsData from '../GetMessagePortCountsData/GetMessagePortCountsData.js'

export const name = 'message-port-count'

export const getData = GetMessagePortCountsData.getMessagePortCountsData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'MessagePort Count',
  })
}

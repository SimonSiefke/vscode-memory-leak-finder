import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetObjectCountsData from '../GetObjectCountsData/GetObjectCountsData.js'

export const name = 'object-count'

export const getData = GetObjectCountsData.getObjectCountsData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Object Count',
  })
}

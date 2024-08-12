import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetNumberCountData from '../GetNumberCountsData/GetNumberCountsData.js'

export const name = 'number-count'

export const getData = GetNumberCountData.getNumberCountsData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Number Count',
  })
}

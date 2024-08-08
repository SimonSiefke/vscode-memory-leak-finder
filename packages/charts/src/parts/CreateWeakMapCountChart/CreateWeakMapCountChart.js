import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetWeakMapCountData from '../GetWeakMapCountData/GetWeakMapCountData.js'

export const name = 'weak-map-count'

export const getData = GetWeakMapCountData.getWeakMapCountData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Weak Map Count',
  })
}

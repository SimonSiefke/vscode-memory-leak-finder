import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetWeakSetCountData from '../GetWeakSetCountData/GetWeakSetCountData.js'

export const name = 'weak-set-count'

export const getData = GetWeakSetCountData.getWeakSetCountData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Weak Set Count',
  })
}

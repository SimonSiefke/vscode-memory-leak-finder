import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetEditContextCountData from '../GetEditContextCountData/GetEditContextCountData.js'

export const name = 'edit-context-count'

export const getData = GetEditContextCountData.getEditContextCountData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Edit Context Count',
  })
}

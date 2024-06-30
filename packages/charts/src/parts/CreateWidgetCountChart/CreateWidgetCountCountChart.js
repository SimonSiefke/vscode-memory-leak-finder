import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetWidgetCountData from '../GetWidgetCountData/GetWidgetCountData.js'

export const name = 'widget-count'

export const getData = GetWidgetCountData.getWidgetCountData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Widget Count',
  })
}

import * as GetWidgetCountData from '../GetWidgetCountData/GetWidgetCountData.js'

export const name = 'widget-count'

export const getData = GetWidgetCountData.getWidgetCountData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Widget Count',
  }
}

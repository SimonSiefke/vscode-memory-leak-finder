import * as GetWidgetCountData from '../GetWidgetCountData/GetWidgetCountData.ts'

export const name = 'widget-count'

export const getData = (basePath: string) => GetWidgetCountData.getWidgetCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Widget Count',
  }
}

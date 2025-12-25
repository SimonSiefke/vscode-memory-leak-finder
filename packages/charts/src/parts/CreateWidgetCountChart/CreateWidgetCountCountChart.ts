import * as GetWidgetCountData from '../GetWidgetCountData/GetWidgetCountData.ts'

export const name = 'widget-count'

export const getData = (basePath: string): Promise<any[]> => GetWidgetCountData.getWidgetCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Widget Count',
  }
}

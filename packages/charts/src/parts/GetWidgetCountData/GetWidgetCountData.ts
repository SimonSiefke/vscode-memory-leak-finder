import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getWidgetCountData = (basePath: string) => {
  return GetCountData.getCountData('widget-count', 'widgetCount', basePath)
}

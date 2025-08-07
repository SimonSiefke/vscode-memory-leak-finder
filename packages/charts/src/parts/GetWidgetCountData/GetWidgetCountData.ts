import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getWidgetCountData = () => {
  return GetCountData.getCountData('widget-count', 'widgetCount')
}

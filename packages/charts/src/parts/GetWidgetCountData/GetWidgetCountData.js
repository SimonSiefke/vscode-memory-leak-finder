import * as GetCountData from '../GetCountData/GetCountData.js'

export const getWidgetCountData = () => {
  return GetCountData.getCountData('widget-count', 'widgetCount')
}

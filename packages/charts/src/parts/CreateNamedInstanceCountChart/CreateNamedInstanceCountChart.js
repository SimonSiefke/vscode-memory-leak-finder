import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetNamedInstanceCountData from '../GetNamedInstanceCountData/GetNamedInstanceCountData.js'

export const name = 'named-instance-count'

export const getData = GetNamedInstanceCountData.getNamedInstanceCountData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'FocusTracker Count',
  })
}

import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetMutationObserverCountData from '../GetMutationObserverCountData/GetMutationObserverCountData.js'

export const name = 'mutation-observer-count'

export const getData = GetMutationObserverCountData.getObjectCountsData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Mutation Observer Count',
  })
}

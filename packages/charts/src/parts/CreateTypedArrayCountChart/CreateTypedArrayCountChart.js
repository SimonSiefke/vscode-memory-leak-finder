import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetTypedArrayCountsData from '../GetTypedArrayCountsData/GetTypedArrayCountsData.js'

export const name = 'typed-array-count'

export const getData = GetTypedArrayCountsData.getTypedArrayCountsData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Typed Array Count',
  })
}

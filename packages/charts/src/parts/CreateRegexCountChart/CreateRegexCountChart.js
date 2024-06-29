import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetRegexCountData from '../GetRegexCountData/GetRegexCountData.js'

export const name = 'regex-count'

export const getData = GetRegexCountData.getRegexCountData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Regex Count',
  })
}

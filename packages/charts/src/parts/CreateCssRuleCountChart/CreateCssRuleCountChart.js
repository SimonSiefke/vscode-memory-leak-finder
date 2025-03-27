import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetCssRuleCountData from '../GetCssRuleCountData/GetCssRuleCountData.js'

export const name = 'css-rule-count'

export const getData = GetCssRuleCountData.getCssRuleCountData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Css Rule Count',
  })
}

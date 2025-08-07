import * as GetCssRuleCountData from '../GetCssRuleCountData/GetCssRuleCountData.ts'

export const name = 'css-rule-count'

export const getData = GetCssRuleCountData.getCssRuleCountData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Css Rule Count',
  }
}

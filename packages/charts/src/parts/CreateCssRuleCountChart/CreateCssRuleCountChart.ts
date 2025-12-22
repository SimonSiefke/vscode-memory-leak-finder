import * as GetCssRuleCountData from '../GetCssRuleCountData/GetCssRuleCountData.ts'

export const name = 'css-rule-count'

export const getData = (basePath: string) => GetCssRuleCountData.getCssRuleCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Css Rule Count',
  }
}

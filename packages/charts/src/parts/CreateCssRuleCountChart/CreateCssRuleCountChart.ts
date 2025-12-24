import * as GetCssRuleCountData from '../GetCssRuleCountData/GetCssRuleCountData.ts'

export const name = 'css-rule-count'

export const getData = (basePath: string): Promise<any[]> => GetCssRuleCountData.getCssRuleCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Css Rule Count',
  }
}

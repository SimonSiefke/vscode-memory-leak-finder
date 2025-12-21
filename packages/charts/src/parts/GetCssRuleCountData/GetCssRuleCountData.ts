import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getCssRuleCountData = (basePath: string) => {
  return GetCountData.getCountData('css-rule-count', 'cssRuleCount', basePath)
}

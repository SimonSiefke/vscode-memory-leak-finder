import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getCssRuleCountData = () => {
  return GetCountData.getCountData('css-rule-count', 'cssRuleCount')
}

import * as GetRegexCountData from '../GetRegexCountData/GetRegexCountData.ts'

export const name = 'regex-count'

export const getData = GetRegexCountData.getRegexCountData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Regex Count',
  }
}

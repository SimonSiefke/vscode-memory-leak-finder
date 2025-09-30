import * as GetRegexCountData from '../GetRegexCountData/GetRegexCountData.ts'

export const name = 'regex-count'

export const getData = (basePath: string) => GetRegexCountData.getRegexCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Regex Count',
  }
}

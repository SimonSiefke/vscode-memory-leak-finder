import * as GetRegexCountData from '../GetRegexCountData/GetRegexCountData.ts'

export const name = 'regex-count'

export const getData = (basePath: string): Promise<any[]> => GetRegexCountData.getRegexCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Regex Count',
  }
}

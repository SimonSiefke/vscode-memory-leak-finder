import * as GetSymbolCountsData from '../GetSymbolCountsData/GetSymbolCountsData.ts'

export const name = 'symbol-count'

export const getData = (basePath: string) => GetSymbolCountsData.getSymbolCountsData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Symbol Count',
  }
}

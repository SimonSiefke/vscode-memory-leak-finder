import * as GetSymbolCountsData from '../GetSymbolCountsData/GetSymbolCountsData.ts'

export const name = 'symbol-count'

export const getData = GetSymbolCountsData.getSymbolCountsData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Symbol Count',
  }
}

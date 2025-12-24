import * as GetSymbolCountsData from '../GetSymbolCountsData/GetSymbolCountsData.ts'

export const name = 'symbol-count'

export const getData = (basePath: string): Promise<any[]> => GetSymbolCountsData.getSymbolCountsData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Symbol Count',
  }
}

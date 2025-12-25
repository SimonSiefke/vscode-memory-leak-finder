import * as GetNumberCountData from '../GetNumberCountsData/GetNumberCountsData.ts'

export const name = 'number-count'

export const getData = (basePath: string): Promise<any[]> => GetNumberCountData.getNumberCountsData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Number Count',
  }
}

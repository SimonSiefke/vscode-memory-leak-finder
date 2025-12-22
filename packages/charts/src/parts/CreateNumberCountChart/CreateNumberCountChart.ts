import * as GetNumberCountData from '../GetNumberCountsData/GetNumberCountsData.ts'

export const name = 'number-count'

export const getData = (basePath: string) => GetNumberCountData.getNumberCountsData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Number Count',
  }
}

import * as GetNumberCountData from '../GetNumberCountsData/GetNumberCountsData.ts'

export const name = 'number-count'

export const getData = GetNumberCountData.getNumberCountsData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Number Count',
  }
}

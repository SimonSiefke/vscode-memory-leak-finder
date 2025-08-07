import * as GetTypedArrayCountsData from '../GetTypedArrayCountsData/GetTypedArrayCountsData.ts'

export const name = 'typed-array-count'

export const getData = GetTypedArrayCountsData.getTypedArrayCountsData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Typed Array Count',
  }
}

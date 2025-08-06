import * as GetTypedArrayCountsData from '../GetTypedArrayCountsData/GetTypedArrayCountsData.js'

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

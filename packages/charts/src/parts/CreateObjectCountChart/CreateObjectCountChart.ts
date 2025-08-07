import * as GetObjectCountsData from '../GetObjectCountsData/GetObjectCountsData.ts'

export const name = 'object-count'

export const getData = GetObjectCountsData.getObjectCountsData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Object Count',
  }
}

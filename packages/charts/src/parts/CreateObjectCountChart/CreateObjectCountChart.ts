import * as GetObjectCountsData from '../GetObjectCountsData/GetObjectCountsData.ts'

export const name = 'object-count'

export const getData = (basePath: string) => GetObjectCountsData.getObjectCountsData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Object Count',
  }
}

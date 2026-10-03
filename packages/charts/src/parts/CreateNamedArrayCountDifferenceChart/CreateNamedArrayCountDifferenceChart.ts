import { getNamedArrayCountDifferenceData } from '../GetNamedArrayCountDifferenceData/GetNamedArrayCountDifferenceData.ts'

export const name = 'named-array-count-difference'
export const getData = getNamedArrayCountDifferenceData
export const multiple = true

export const createChart = () => ({
  fontSize: 12,
  marginLeft: 500,
  marginRight: 500,
  type: 'dual-bar-chart',
  width: 1400,
  x: 'index',
  xLabel: 'Index',
  y: 'count',
  yLabel: 'Array Counts',
})

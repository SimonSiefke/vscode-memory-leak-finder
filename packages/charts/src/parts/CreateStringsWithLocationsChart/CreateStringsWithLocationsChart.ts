import { getStringsWithLocationsData } from '../GetStringsWithLocationsData/GetStringsWithLocationsData.ts'

export const name = 'strings-with-locations'
export const multiple = true
export const getData = getStringsWithLocationsData

export const createChart = () => ({
  fontSize: 12,
  marginLeft: 500,
  marginRight: 200,
  type: 'dual-bar-chart',
  width: 1400,
  x: 'index',
  xLabel: 'Index',
  y: 'count',
  yLabel: 'Added String Objects by Retaining Location',
})

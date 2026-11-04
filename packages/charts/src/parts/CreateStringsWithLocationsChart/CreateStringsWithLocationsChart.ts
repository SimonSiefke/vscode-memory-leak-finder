import { getStringsWithLocationsData } from '../GetStringsWithLocationsData/GetStringsWithLocationsData.ts'

export const name = 'strings-with-locations'
export const multiple = true
export const getData = getStringsWithLocationsData

export const createChart = () => ({
  fontSize: 12,
  marginLeft: 800,
  marginRight: 100,
  type: 'dual-bar-chart',
  rowHeight: 40,
  labelLineWidth: 64,
  width: 1600,
  x: 'index',
  xLabel: 'Index',
  y: 'count',
  yLabel: 'Added String Objects by Retaining Location',
})

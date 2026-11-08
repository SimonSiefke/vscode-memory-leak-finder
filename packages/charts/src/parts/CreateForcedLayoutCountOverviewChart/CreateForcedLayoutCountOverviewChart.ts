import { getForcedLayoutCountOverviewData } from '../GetForcedLayoutCountOverviewData/GetForcedLayoutCountOverviewData.ts'

export const name = 'forced-layout-count'
export const getData = getForcedLayoutCountOverviewData

export const createChart = () => ({
  x: 'index',
  xLabel: 'Index',
  y: 'count',
  yLabel: 'Forced Layout Count',
})

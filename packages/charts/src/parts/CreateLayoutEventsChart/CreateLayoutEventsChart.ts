import * as GetLayoutEventsData from '../GetLayoutEventsData/GetLayoutEventsData.ts'

export const name = 'layout-events'

export const getData = (basePath: string): Promise<any[]> => {
  return GetLayoutEventsData.getLayoutEventsData(basePath)
}

export const createChart = (): {
  fontSize: number
  marginLeft: number
  marginRight: number
  type: string
  width: number
  x: string
  xLabel: string
  y: string
  yLabel: string
} => {
  return {
    fontSize: 12,
    marginLeft: 260,
    marginRight: 220,
    type: 'bar-chart',
    width: 900,
    x: 'value',
    xLabel: 'Duration (ms)',
    y: 'name',
    yLabel: 'Slowest Layout Events',
  }
}

export const multiple = true

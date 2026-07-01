import * as GetPaintEventsData from '../GetPaintEventsData/GetPaintEventsData.ts'

export const name = 'paint-events'

export const getData = (basePath: string): Promise<any[]> => {
  return GetPaintEventsData.getPaintEventsData(basePath)
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
    xLabel: 'Painted Area',
    y: 'name',
    yLabel: 'Largest Paint Events',
  }
}

export const multiple = true

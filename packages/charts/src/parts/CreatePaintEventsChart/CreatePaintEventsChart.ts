import * as GetPaintEventsData from '../GetPaintEventsData/GetPaintEventsData.ts'

export const name = 'paint-events'

export const getData = (basePath: string): Promise<any[]> => {
  return GetPaintEventsData.getPaintEventsData(basePath)
}

export const createChart = (): {
  type: string
  width: number
} => {
  return {
    type: 'paint-events-chart',
    width: 1180,
  }
}

export const multiple = true

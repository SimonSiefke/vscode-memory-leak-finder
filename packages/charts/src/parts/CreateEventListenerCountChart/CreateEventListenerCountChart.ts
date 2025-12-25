import * as GetEventListenerCountData from '../GetEventListenerCountData/GetEventListenerCountData.ts'

export const name = 'event-listener-count'

export const getData = (basePath: string): Promise<any[]> => GetEventListenerCountData.getEventListenerCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Event Listener Count',
  }
}

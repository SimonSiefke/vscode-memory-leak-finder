import * as GetEventListenerCountData from '../GetEventListenerCountData/GetEventListenerCountData.ts'

export const name = 'event-listener-count'

export const getData = (basePath: string) => GetEventListenerCountData.getEventListenerCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Event Listener Count',
  }
}

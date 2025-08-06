import * as GetEventListenerCountData from '../GetEventListenerCountData/GetEventListenerCountData.js'

export const name = 'event-listener-count'

export const getData = GetEventListenerCountData.getEventListenerCountData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Event Listener Count',
  }
}

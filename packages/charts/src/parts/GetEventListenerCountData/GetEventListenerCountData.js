import * as GetCountData from '../GetCountData/GetCountData.js'

export const getEventListenerCountData = () => {
  return GetCountData.getCountData('event-listener-count', 'eventListenerCount')
}

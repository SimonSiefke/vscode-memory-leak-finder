import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getEventListenerCountData = () => {
  return GetCountData.getCountData('event-listener-count', 'eventListenerCount')
}

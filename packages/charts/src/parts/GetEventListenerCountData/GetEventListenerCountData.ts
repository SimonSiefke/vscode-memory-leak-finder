import * as GetCountData from '../GetCountData/GetCountData.ts'

export const getEventListenerCountData = (basePath: string) => {
  return GetCountData.getCountData('event-listener-count', 'eventListenerCount', basePath)
}

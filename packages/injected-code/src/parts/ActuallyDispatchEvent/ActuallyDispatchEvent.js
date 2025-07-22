import * as GetEventClass from '../GetEventClass/GetEventClass.js'

export const actuallyDispatchEvent = (element, eventType, options) => {
  const constructor = GetEventClass.getEventClass(eventType)
  const event = new constructor(eventType, options)
  element.dispatchEvent(event)
}

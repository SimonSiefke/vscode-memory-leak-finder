import * as GetEventClass from '../GetEventClass/GetEventClass.ts'

export const actuallyDispatchEvent = (element: any, eventType: any, options: any) => {
  const constructor = GetEventClass.getEventClass(eventType)
  const event = new constructor(eventType, options)
  element.dispatchEvent(event)
  return event
}

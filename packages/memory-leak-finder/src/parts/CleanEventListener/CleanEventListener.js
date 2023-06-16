import { cleanEventListenerDescription } from '../CleanEventListenerDescription/CleanEventListenerDescription.js'

export const cleanEventListener = (eventListener) => {
  return {
    type: eventListener.type,
    lineNumber: eventListener.lineNumber,
    columnNumber: eventListener.columnNumber,
    description: cleanEventListenerDescription(eventListener.handler.description),
    objectId: eventListener.handler.objectId,
  }
}

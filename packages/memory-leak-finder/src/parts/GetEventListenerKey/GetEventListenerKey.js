import * as Assert from '../Assert/Assert.js'

export const getEventListenerKey = (listener) => {
  Assert.number(listener.lineNumber)
  Assert.number(listener.columnNumber)
  return `${listener.lineNumber}:${listener.columnNumber}`
}

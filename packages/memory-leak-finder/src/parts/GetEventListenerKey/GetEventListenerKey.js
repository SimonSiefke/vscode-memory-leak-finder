import * as Assert from '../Assert/Assert.js'

export const getEventListenerKey = (listener) => {
  if ('location' in listener) {
    return listener.location
  }
  if ('stack' in listener) {
    return listener.stack[0]
  }
  Assert.number(listener.lineNumber)
  Assert.number(listener.columnNumber)
  return `${listener.lineNumber}:${listener.columnNumber}`
}

import * as Assert from '../Assert/Assert.ts'

export const getEventListenerKey = (listener) => {
  if ('location' in listener) {
    return listener.location
  }
  if ('stack' in listener) {
    return listener.stack.join('')
  }
  Assert.number(listener.lineNumber)
  Assert.number(listener.columnNumber)
  return `${listener.lineNumber}:${listener.columnNumber}`
}

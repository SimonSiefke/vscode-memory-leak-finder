import type { Dynamic } from '../Types/Types.ts'
import * as Assert from '../Assert/Assert.ts'
export const getEventListenerKey = (listener: Dynamic) => {
  Assert.string(listener.type)
  if ('location' in listener) {
    return JSON.stringify([listener.type, listener.location])
  }
  if ('stack' in listener) {
    return JSON.stringify([listener.type, listener.stack.join('')])
  }
  Assert.number(listener.lineNumber)
  Assert.number(listener.columnNumber)
  return JSON.stringify([listener.type, listener.lineNumber, listener.columnNumber])
}

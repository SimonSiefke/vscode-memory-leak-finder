import type { Dynamic } from '../Types/Types.ts'
import * as CleanEventListener from '../CleanEventListener/CleanEventListener.ts'
export const cleanEventListeners = (eventListeners: Dynamic, scriptMap: Dynamic) => {
  const cleanListeners: Dynamic[] = []
  for (const listener of eventListeners) {
    const cleanListener = CleanEventListener.cleanEventListener(listener, scriptMap)
    cleanListeners.push(cleanListener)
  }
  return cleanListeners
}

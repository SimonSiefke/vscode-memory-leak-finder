import * as CleanEventListener from '../CleanEventListener/CleanEventListener.js'

export const cleanEventListeners = (eventListeners, scriptMap) => {
  const cleanListeners = []
  for (const listener of eventListeners) {
    const cleanListener = CleanEventListener.cleanEventListener(listener, scriptMap)
    cleanListeners.push(cleanListener)
  }
  return cleanListeners
}

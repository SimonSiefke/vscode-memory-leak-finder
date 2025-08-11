import * as AddStackTraceToEventListener from '../AddStackTraceToEventListener/AddStackTraceToEventListener.ts'

export const addStackTracesToEventListeners = async (session, leakingEventListeners) => {
  const promises = []
  for (const leakingEventListener of leakingEventListeners) {
    promises.push(AddStackTraceToEventListener.addStackTraceToEventListener(session, leakingEventListener))
  }
  const eventListenersWithStackTraces = await Promise.all(promises)
  return eventListenersWithStackTraces
}

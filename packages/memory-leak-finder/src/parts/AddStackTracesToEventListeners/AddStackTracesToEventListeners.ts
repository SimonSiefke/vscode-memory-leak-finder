import * as AddStackTraceToEventListener from '../AddStackTraceToEventListener/AddStackTraceToEventListener.ts'
import type { Session } from '../Session/Session.ts'

export const addStackTracesToEventListeners = async (session: Session, leakingEventListeners: readonly any[]) => {
  const promises: Promise<any>[] = []
  // TODO could optimize this by doing one call and returning all matching stack traces from it
  for (const leakingEventListener of leakingEventListeners) {
    promises.push(AddStackTraceToEventListener.addStackTraceToEventListener(session, leakingEventListener))
  }
  const eventListenersWithStackTraces = await Promise.all(promises)
  return eventListenersWithStackTraces
}

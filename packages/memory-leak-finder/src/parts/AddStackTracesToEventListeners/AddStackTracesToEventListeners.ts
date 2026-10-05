import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import * as AddStackTraceToEventListener from '../AddStackTraceToEventListener/AddStackTraceToEventListener.ts'
export const addStackTracesToEventListeners = async (session: Session, leakingEventListeners: readonly Dynamic[]) => {
  const promises: Promise<Dynamic>[] = []
  // TODO could optimize this by doing one call and returning all matching stack traces from it
  for (const leakingEventListener of leakingEventListeners) {
    promises.push(AddStackTraceToEventListener.addStackTraceToEventListener(session, leakingEventListener))
  }
  const eventListenersWithStackTraces = await Promise.all(promises)
  return eventListenersWithStackTraces
}

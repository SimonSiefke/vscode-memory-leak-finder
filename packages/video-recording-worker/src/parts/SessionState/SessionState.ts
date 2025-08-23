import * as PTimeout from '../PTimeout/PTimeout.ts'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.ts'

interface State {
  sessionMap: Record<any, any>
  targetCallbackMap: Record<any, any>
}

export const state: State = {
  sessionMap: Object.create(null),
  targetCallbackMap: Object.create(null),
}

export const reset = () => {
  state.sessionMap = Object.create(null)
  state.targetCallbackMap = Object.create(null)
}

export const addSession = (sessionId: string, session: any) => {
  state.sessionMap[sessionId] = session
  if (session.type in state.targetCallbackMap) {
    state.targetCallbackMap[session.type]
    delete state.targetCallbackMap[session.type]
  }
}

export const removeSession = (sessionId: string) => {
  delete state.sessionMap[sessionId]
}

export const hasSession = (sessionId: string) => {
  return sessionId in state.sessionMap
}

export const getSession = (sessionId: string) => {
  return state.sessionMap[sessionId]
}

export const waitForTarget = (type: any, fn: any) => {
  for (const session of Object.values(state.sessionMap)) {
    if (session.type === type) {
      return session
    }
  }
  const cdp = PTimeout.pTimeout(
    (() => {
      const { resolve, promise } = Promise.withResolvers<any>()
      state.targetCallbackMap[type] = resolve
      return promise
    })(),
    { milliseconds: TimeoutConstants.SessionState },
  )
  return cdp
}

export const getAllSessions = () => {
  return Object.values(state.sessionMap)
}

export const getPageSession = () => {
  for (const session of Object.values(state.sessionMap)) {
    if (session.type === 'page') {
      return session
    }
  }
  return undefined
}

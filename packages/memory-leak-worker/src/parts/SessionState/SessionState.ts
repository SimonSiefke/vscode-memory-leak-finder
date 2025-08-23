import * as PTimeout from '../PTimeout/PTimeout.ts'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.ts'

export interface Session {
  readonly type: string
  readonly id?: string
  rpc?: any
  readonly url?: string
  readonly sessionId?: string
  readonly objectType?: string
}

interface State {
  sessionMap: Record<string, Session>
  targetCallbackMap: Record<string, any>
}

export const state: State = {
  sessionMap: Object.create(null),
  targetCallbackMap: Object.create(null),
}

export const reset = () => {
  state.sessionMap = Object.create(null)
  state.targetCallbackMap = Object.create(null)
}

export const addSession = (sessionId: string, session: Session): void => {
  state.sessionMap[sessionId] = session
  if (session.type in state.targetCallbackMap) {
    state.targetCallbackMap[session.type]
    delete state.targetCallbackMap[session.type]
  }
}

export const removeSession = (sessionId: string): void => {
  delete state.sessionMap[sessionId]
}

export const hasSession = (sessionId: string): boolean => {
  return sessionId in state.sessionMap
}

export const getSession = (sessionId: string): Session | undefined => {
  return state.sessionMap[sessionId]
}

export const waitForTarget = (type: string, fn: any): any => {
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

export const getAllSessions = (): readonly Session[] => {
  return Object.values(state.sessionMap)
}

export const getPageSession = (): Session | undefined => {
  for (const session of Object.values(state.sessionMap)) {
    if (session.type === 'page') {
      return session
    }
  }
  return undefined
}

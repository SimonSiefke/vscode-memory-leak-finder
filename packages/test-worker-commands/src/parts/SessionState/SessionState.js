import * as PTimeout from '../PTimeout/PTimeout.js'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.js'

export const state = {
  sessionMap: Object.create(null),
  targetCallbackMap: Object.create(null),
}

export const reset = () => {
  state.sessionMap = Object.create(null)
  state.targetCallbackMap = Object.create(null)
}

export const addSession = (sessionId, session) => {
  state.sessionMap[sessionId] = session
  if (session.type in state.targetCallbackMap) {
    state.targetCallbackMap[session.type]
    delete state.targetCallbackMap[session.type]
  }
}

export const removeSession = (sessionId) => {
  delete state.sessionMap[sessionId]
}

export const hasSession = (sessionId) => {
  return sessionId in state.sessionMap
}

export const getSession = (sessionId) => {
  return state.sessionMap[sessionId]
}

export const waitForTarget = (type, fn) => {
  for (const session of Object.values(state.sessionMap)) {
    if (session.type === type) {
      return session
    }
  }
  const cdp = PTimeout.pTimeout(
    new Promise((resolve, reject) => {
      // const cleanup = () => {
      //   delete state.targetCallbackMap[type]
      // }
      // const handleSuccess = (value) => {
      //   cleanup()
      //   resolve(value)
      // }
      // const handleTimeout = () => {
      //   delete state.targetCallbackMap[type]
      //   reject()
      // }
      state.targetCallbackMap[type] = resolve
      // setTimeout(handleTimeout, 500)
    }),
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

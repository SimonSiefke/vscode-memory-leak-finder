import { VError } from '../VError/VError.js'
import * as Assert from '../Assert/Assert.js'
import * as PTimeout from '../PTimeout/PTimeout.js'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.js'

export const state = {
  executionContexts: Object.create(null),
  defaultExecutionContextCallbacks: Object.create(null),
  utilityExecutionContextCallbacks: Object.create(null),
  crashCallbacks: Object.create(null),
}

export const reset = () => {
  state.executionContexts = Object.create(null)
  state.defaultExecutionContextCallbacks = Object.create(null)
  state.utilityExecutionContextCallbacks = Object.create(null)
  state.crashCallbacks = Object.create(null)
}

const isDefaultExecutionContext = (executionContext, sessionId) => {
  return executionContext.sessionId === sessionId && executionContext.type === 'default'
}

const isUtilityExecutionContext = (executionContext, sessionId) => {
  return executionContext.sessionId === sessionId && executionContext.name === 'utility'
}

export const add = (id, executionContext) => {
  const { executionContexts, defaultExecutionContextCallbacks, utilityExecutionContextCallbacks } = state
  const { sessionId, type, name } = executionContext
  // console.log('add executioncontext', id, executionContext)
  executionContexts[id] = executionContext
  // console.log({
  //   sessionId,
  //   type,
  //   name,
  //   inCallback: sessionId in utilityExecutionContextCallbacks,
  //   keys: Object.keys(utilityExecutionContextCallbacks),
  // })
  if (sessionId in defaultExecutionContextCallbacks && type === 'default') {
    defaultExecutionContextCallbacks[sessionId](executionContext)
    delete defaultExecutionContextCallbacks[sessionId]
  } else if (sessionId in utilityExecutionContextCallbacks && name === 'utility') {
    utilityExecutionContextCallbacks[sessionId](executionContext)
    delete utilityExecutionContextCallbacks[sessionId]
  }
}

export const remove = (uniqueId) => {
  delete state.executionContexts[uniqueId]
}

export const removeBySessionId = (sessionId) => {
  Assert.string(sessionId)
  const toDelete = []
  for (const executionContext of Object.values(state.executionContexts)) {
    if (executionContext.sessionId === sessionId) {
      toDelete.push(executionContext.uniqueId)
    }
  }
  for (const uniqueId of toDelete) {
    delete state.executionContexts[uniqueId]
  }
}

export const getAll = () => {
  return Object.values(state.executionContexts)
}

export const waitForDefaultExecutionContext = async (sessionId) => {
  try {
    Assert.string(sessionId)
    for (const executionContext of Object.values(state.executionContexts)) {
      if (isDefaultExecutionContext(executionContext, sessionId)) {
        return executionContext
      }
    }
    return await PTimeout.pTimeout(
      new Promise((resolve, reject) => {
        state.defaultExecutionContextCallbacks[sessionId] = resolve
      }),
      { milliseconds: TimeoutConstants.DefaultExecutionContext },
    )
  } catch (error) {
    // @ts-ignore
    throw new VError(error, `Failed to get default execution context`)
  }
}

export const waitForUtilityExecutionContext = async (sessionId) => {
  try {
    Assert.string(sessionId)
    for (const executionContext of Object.values(state.executionContexts)) {
      if (isUtilityExecutionContext(executionContext, sessionId)) {
        return executionContext
      }
    }
    return await PTimeout.pTimeout(
      new Promise((resolve, reject) => {
        state.utilityExecutionContextCallbacks[sessionId] = resolve
      }),
      { milliseconds: TimeoutConstants.UtilityExecutionContext },
    )
  } catch (error) {
    throw new VError(`Failed to wait for utility execution context: ${error}`)
  }
}

export const get = (id) => {
  return state.executionContexts[id]
}

export const has = (id) => {
  return id in state.executionContexts
}

export const addExecutionContextStateCallback = (fn) => {}

export const getDefaultExecutionContext = (sessionId) => {
  for (const executionContext of Object.values(state.executionContexts)) {
    if (executionContext.sessionId === sessionId) {
      return executionContext
    }
  }
  return undefined
}

export const getUtilityExecutionContext = (sessionId) => {
  for (const executionContext of Object.values(state.executionContexts)) {
    if (executionContext.name === 'utility' && executionContext.sessionId === sessionId) {
      return executionContext
    }
  }
  console.log(Object.values(state.executionContexts))
  return undefined
}

export const registerCrashListener = (targetId, fn) => {
  state.crashCallbacks[targetId] = fn
}

export const removeCrashListener = (targetId) => {
  delete state.crashCallbacks[targetId]
}

export const executeCrashListener = (targetId) => {
  const fn = state.crashCallbacks[targetId]
  if (!fn) {
    console.log(state.crashCallbacks)
    console.log(targetId)
    console.info('no crash listener')
    return
  }
  fn()
}

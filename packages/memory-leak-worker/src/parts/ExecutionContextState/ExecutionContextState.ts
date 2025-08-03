import * as Assert from '../Assert/Assert.js'
import * as PTimeout from '../PTimeout/PTimeout.js'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.js'
import { VError } from '../VError/VError.js'

export interface ExecutionContext {
  readonly sessionId: string
  readonly uniqueId: string
  readonly type?: string
  readonly name?: string
}

interface State {
  executionContexts: Record<string, ExecutionContext>
  defaultExecutionContextCallbacks: Record<string, any>
  utilityExecutionContextCallbacks: Record<string, any>
  crashCallbacks: Record<string, any>
}

export const state: State = {
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

const isDefaultExecutionContext = (executionContext: ExecutionContext, sessionId: string): boolean => {
  return executionContext.sessionId === sessionId && executionContext.type === 'default'
}

const isUtilityExecutionContext = (executionContext: ExecutionContext, sessionId: string): boolean => {
  return executionContext.sessionId === sessionId && executionContext.name === 'utility'
}

export const add = (id: string, executionContext: ExecutionContext): void => {
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

export const remove = (uniqueId: string): void => {
  delete state.executionContexts[uniqueId]
}

export const removeBySessionId = (sessionId: string): void => {
  Assert.string(sessionId)
  const toDelete: string[] = []
  for (const executionContext of Object.values(state.executionContexts)) {
    if (executionContext.sessionId === sessionId) {
      toDelete.push(executionContext.uniqueId)
    }
  }
  for (const uniqueId of toDelete) {
    delete state.executionContexts[uniqueId]
  }
}

export const getAll = (): readonly ExecutionContext[] => {
  return Object.values(state.executionContexts)
}

export const waitForDefaultExecutionContext = async (sessionId: string): Promise<ExecutionContext> => {
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

export const waitForUtilityExecutionContext = async (sessionId: string): Promise<ExecutionContext> => {
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

export const get = (id: string): ExecutionContext | undefined => {
  return state.executionContexts[id]
}

export const has = (id: string): boolean => {
  return id in state.executionContexts
}

export const addExecutionContextStateCallback = (fn: any): void => {}

export const getDefaultExecutionContext = (sessionId: string): ExecutionContext | undefined => {
  for (const executionContext of Object.values(state.executionContexts)) {
    if (executionContext.sessionId === sessionId) {
      return executionContext
    }
  }
  return undefined
}

export const getUtilityExecutionContext = (sessionId: string): ExecutionContext | undefined => {
  for (const executionContext of Object.values(state.executionContexts)) {
    if (executionContext.name === 'utility' && executionContext.sessionId === sessionId) {
      return executionContext
    }
  }
  return undefined
}

export const registerCrashListener = (targetId: string, fn: any): void => {
  Assert.string(targetId)
  Assert.fn(fn)
  state.crashCallbacks[targetId] = fn
}

export const removeCrashListener = (targetId: string): void => {
  Assert.string(targetId)
  delete state.crashCallbacks[targetId]
}

export const executeCrashListener = (targetId: string): void => {
  Assert.string(targetId)
  const fn = state.crashCallbacks[targetId]
  if (!fn) {
    console.log(state.crashCallbacks)
    console.log(targetId)
    console.info('no crash listener')
    return
  }
  fn()
}

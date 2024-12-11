import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.js'

export const waitForCrash = (window) => {
  const { resolve, promise } = Promise.withResolvers()
  const crashCallback = () => {
    ExecutionContextState.removeCrashListener(window.targetId)
    resolve({ crashed: true })
  }
  const cleanup = () => {
    ExecutionContextState.removeCrashListener(window.targetId)
    resolve({ crashed: false })
  }
  ExecutionContextState.registerCrashListener(window.targetId, crashCallback)
  return {
    resolve,
    cleanup,
    promise,
  }
}

import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.js'
import * as Assert from '../Assert/Assert.js'

export const waitForCrash = (window) => {
  const targetId = window.targetId
  Assert.string(targetId)
  const { resolve, promise } = Promise.withResolvers()
  const crashCallback = () => {
    ExecutionContextState.removeCrashListener(targetId)
    resolve({ crashed: true })
  }
  const cleanup = () => {
    ExecutionContextState.removeCrashListener(targetId)
    resolve({ crashed: false })
  }
  console.log('register crash', targetId)
  ExecutionContextState.registerCrashListener(targetId, crashCallback)
  return {
    resolve,
    cleanup,
    promise,
  }
}

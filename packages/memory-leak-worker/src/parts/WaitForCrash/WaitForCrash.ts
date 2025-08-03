import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.js'
import * as Assert from '../Assert/Assert.js'

export const waitForCrash = (targetId: string): { readonly promise: Promise<any>; readonly cleanup: () => void } => {
  Assert.string(targetId)
  const { resolve, promise } = Promise.withResolvers()
  const crashCallback = () => {
    ExecutionContextState.removeCrashListener(targetId)
    resolve({ crashed: true })
  }
  const cleanup = () => {
    ExecutionContextState.removeCrashListener(targetId)
  }
  ExecutionContextState.registerCrashListener(targetId, crashCallback)
  return {
    promise,
    cleanup,
  }
}

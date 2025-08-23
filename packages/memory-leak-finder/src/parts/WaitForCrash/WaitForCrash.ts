import * as Assert from '../Assert/Assert.ts'
import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.ts'

export const crashInfo = { crashed: true }

export const waitForCrash = (targetId: string): { readonly promise: Promise<any>; readonly cleanup: () => void } => {
  Assert.string(targetId)
  const { resolve, promise } = Promise.withResolvers()
  const crashCallback = () => {
    ExecutionContextState.removeCrashListener(targetId)
    resolve(crashInfo)
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

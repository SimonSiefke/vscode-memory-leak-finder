export const crashInfo = { crashed: true }

export const waitForCrash = (targetId: string): { readonly promise: Promise<any>; readonly cleanup: () => void } => {
  // TODO maybe implement this in intilization worker or test worker
  // when a target crashes, the test run should fail and workers should exit
  // and the application should be closed

  // Assert.string(targetId)
  const { resolve, promise } = Promise.withResolvers()
  // const crashCallback = () => {
  //   ExecutionContextState.removeCrashListener(targetId)
  //   resolve(crashInfo)
  // }
  // const cleanup = () => {
  //   ExecutionContextState.removeCrashListener(targetId)
  // }
  // ExecutionContextState.registerCrashListener(targetId, crashCallback)
  return {
    promise,
    cleanup() {},
  }
}

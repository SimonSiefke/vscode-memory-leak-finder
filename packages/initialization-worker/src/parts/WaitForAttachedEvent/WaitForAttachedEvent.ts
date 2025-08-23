import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'

export const waitForAttachedEvent = (browserRpc: any, timeout: number): Promise<any> => {
  const { resolve, promise } = Promise.withResolvers()

  const cleanup = (result) => {
    browserRpc.off(DevtoolsEventType.TargetAttachedToTarget, handleAttached)
    clearTimeout(timeoutRef)
    resolve(result)
  }
  const handleAttached = (message) => {
    cleanup(message)
  }
  const handleTimeout = () => {
    cleanup(null)
  }
  browserRpc.on(DevtoolsEventType.TargetAttachedToTarget, handleAttached)
  const timeoutRef = setTimeout(handleTimeout, timeout)
  return promise
}

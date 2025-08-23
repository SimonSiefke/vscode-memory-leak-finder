import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'

export const waitForAttachedEvent = (browserRpc: any, timeout: number): Promise<any> => {
  const { resolve, promise } = Promise.withResolvers()

  const cleanup = (result: any): void => {
    browserRpc.off(DevtoolsEventType.TargetAttachedToTarget, handleAttached)
    clearTimeout(timeoutRef)
    resolve(result)
  }
  const handleAttached = (message: any): void => {
    cleanup(message)
  }
  const handleTimeout = (): void => {
    cleanup(null)
  }
  browserRpc.on(DevtoolsEventType.TargetAttachedToTarget, handleAttached)
  const timeoutRef = setTimeout(handleTimeout, timeout)
  return promise
}

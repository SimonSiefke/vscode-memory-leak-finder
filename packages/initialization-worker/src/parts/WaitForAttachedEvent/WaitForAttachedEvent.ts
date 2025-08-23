import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'

export const waitForAttachedEvent = (browserRpc: any, timeout: number): Promise<any> => {
  const { resolve, promise } = Promise.withResolvers()

  const cleanup = (result) => {
    browserRpc.off(DevtoolsEventType.TargetAttachedToTarget, handleAttached)
    resolve(result)
  }
  const handleAttached = (message) => {
    cleanup(message)
  }
  browserRpc.on(DevtoolsEventType.TargetAttachedToTarget, handleAttached)
  return promise
}

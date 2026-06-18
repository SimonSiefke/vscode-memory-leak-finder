import type { Dynamic } from '../Types/Types.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
export const waitForAttachedEvent = (browserRpc: Dynamic, timeout: number): Promise<Dynamic> => {
  const { promise, resolve } = Promise.withResolvers()
  const cleanup = (result: Dynamic): void => {
    browserRpc.off(DevtoolsEventType.TargetAttachedToTarget, handleAttached)
    clearTimeout(timeoutRef)
    resolve(result)
  }
  const handleAttached = (message: Dynamic): void => {
    cleanup(message)
  }
  const handleTimeout = (): void => {
    cleanup(null)
  }
  browserRpc.on(DevtoolsEventType.TargetAttachedToTarget, handleAttached)
  const timeoutRef = setTimeout(handleTimeout, timeout)
  return promise
}

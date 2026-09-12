import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'

export const waitForAttachedEvent = (
  browserRpc: any,
  timeout: number,
  accept: (message: any) => boolean | Promise<boolean> = () => true,
): Promise<any> => {
  const { promise, resolve } = Promise.withResolvers()
  let settled = false

  const cleanup = (result: any): void => {
    settled = true
    browserRpc.off(DevtoolsEventType.TargetAttachedToTarget, handleAttached)
    clearTimeout(timeoutRef)
    resolve(result)
  }
  const handleAttached = async (message: any): Promise<void> => {
    if (settled || !(await accept(message))) {
      return
    }
    cleanup(message)
  }
  const handleTimeout = (): void => {
    cleanup(null)
  }
  browserRpc.on(DevtoolsEventType.TargetAttachedToTarget, handleAttached)
  const timeoutRef = setTimeout(handleTimeout, timeout)
  return promise
}

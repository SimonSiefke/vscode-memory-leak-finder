import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'

export const waitForAttachedEvent = (browserRpc: any, timeout: number): Promise<any> => {
  const { promise, resolve } = Promise.withResolvers()

  const cleanup = (result: any): void => {
    browserRpc.off(DevtoolsEventType.TargetAttachedToTarget, handleAttached)
    clearTimeout(timeoutRef)
    resolve(result)
  }
  const handleAttached = (message: any): void => {
    const targetInfo = message?.params?.targetInfo
    console.error(
      `[macos-ci-debug] Target.attachedToTarget event sessionId=${message?.params?.sessionId} targetId=${targetInfo?.targetId} type=${targetInfo?.type} url=${JSON.stringify(targetInfo?.url ?? '')}`,
    )
    cleanup(message)
  }
  const handleTimeout = (): void => {
    console.error(`[macos-ci-debug] waitForAttachedEvent timed out after ${timeout}ms`)
    cleanup(null)
  }
  browserRpc.on(DevtoolsEventType.TargetAttachedToTarget, handleAttached)
  const timeoutRef = setTimeout(handleTimeout, timeout)
  return promise
}

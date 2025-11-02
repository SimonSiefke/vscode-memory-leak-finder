import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'

export const waitForSubFrameContext = (rpc, urlRegex, timeout) => {
  const { resolve, promise } = Promise.withResolvers()
  const contexts = Object.create(null)
  const loaded = Object.create(null)
  let matchingFrameId = ''
  const cleanupMaybe = () => {
    if (matchingFrameId && matchingFrameId in contexts && matchingFrameId in loaded) {
      cleanup({
        frameId: matchingFrameId,
        contextId: contexts[matchingFrameId],
      })
    }
  }
  const handleExecutionContextCreated = (event) => {
    contexts[event.params.context.auxData.frameId] = event.params.context.uniqueId
    cleanupMaybe()
  }
  const handleFrameNavigation = (event) => {
    if (urlRegex.test(event.params.url)) {
      matchingFrameId = event.params.frameId
    }
    cleanupMaybe()
  }
  const handleFrameStoppedLoading = (event) => {
    loaded[event.params.frameId] = true
    cleanupMaybe()
  }
  const handleTimeout = () => {
    cleanup(null)
  }
  const cleanup = (result) => {
    rpc.off(DevtoolsEventType.RuntimeExecutionContextCreated, handleExecutionContextCreated)
    rpc.off(DevtoolsEventType.PageFrameRequestedNavigation, handleFrameNavigation)
    rpc.off(DevtoolsEventType.PageFrameStoppedLoading, handleFrameStoppedLoading)
    clearTimeout(timeoutRef)
    resolve(result)
  }
  rpc.on(DevtoolsEventType.RuntimeExecutionContextCreated, handleExecutionContextCreated)
  rpc.on(DevtoolsEventType.PageFrameRequestedNavigation, handleFrameNavigation)
  rpc.on(DevtoolsEventType.PageFrameStoppedLoading, handleFrameStoppedLoading)
  const timeoutRef = setTimeout(handleTimeout, timeout)
  return promise
}

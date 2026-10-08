import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'

export const waitForSubFrameContextEvent = (rpc: any, urlRegex: RegExp, timeout: number, signal: AbortSignal) => {
  const { promise, resolve } = Promise.withResolvers()
  const loaded = Object.create(null)
  let matchingFrameId = ''
  const cleanupMaybe = () => {
    if (matchingFrameId && matchingFrameId in loaded) {
      cleanup({
        frameId: matchingFrameId,
      })
    }
  }
  const handleFrameNavigation = (event: any) => {
    if (urlRegex.test(event.params.url)) {
      matchingFrameId = event.params.frameId
    }
    cleanupMaybe()
  }
  const handleFrameStoppedLoading = (event: any) => {
    loaded[event.params.frameId] = true
    cleanupMaybe()
  }
  const handleDocumentOpened = (event: any) => {
    if (urlRegex.test(event.params.frame.url)) {
      matchingFrameId = event.params.frame.id
      loaded[event.params.frame.id] = true
    }
    cleanupMaybe()
  }
  const handleTimeout = () => {
    cleanup(null)
  }
  const handleAbort = () => {
    cleanup(null)
  }
  const cleanup = (result: any) => {
    rpc.off(DevtoolsEventType.PageFrameRequestedNavigation, handleFrameNavigation)
    rpc.off(DevtoolsEventType.PageFrameStoppedLoading, handleFrameStoppedLoading)
    rpc.off(DevtoolsEventType.PageDocumentOpened, handleDocumentOpened)
    clearTimeout(timeoutRef)
    signal.onabort = null
    resolve(result)
  }
  rpc.on(DevtoolsEventType.PageFrameRequestedNavigation, handleFrameNavigation)
  rpc.on(DevtoolsEventType.PageFrameStoppedLoading, handleFrameStoppedLoading)
  rpc.on(DevtoolsEventType.PageDocumentOpened, handleDocumentOpened)
  const timeoutRef = setTimeout(handleTimeout, timeout)
  signal.onabort = handleAbort
  return promise
}

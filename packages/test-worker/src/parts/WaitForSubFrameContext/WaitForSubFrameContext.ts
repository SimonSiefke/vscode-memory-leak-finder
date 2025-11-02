import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'

export const waitForSubFrameContext = (rpc, urlRegex, timeout) => {
  const { resolve, promise } = Promise.withResolvers()
  const loaded = Object.create(null)
  let matchingFrameId = ''
  const cleanupMaybe = () => {
    if (matchingFrameId && matchingFrameId in loaded) {
      cleanup({
        frameId: matchingFrameId,
      })
    }
  }
  const handleFrameNavigation = (event) => {
    console.log(event)
    if (urlRegex.test(event.params.url)) {
      matchingFrameId = event.params.frameId
    }
    cleanupMaybe()
  }
  const handleFrameStoppedLoading = (event) => {
    console.log(event)
    loaded[event.params.frameId] = true
    cleanupMaybe()
  }
  const handleDocumentOpened = (event) => {
    console.log(event)
    if (urlRegex.test(event.params.frame.url)) {
      matchingFrameId = event.params.id
    }
    cleanupMaybe()
  }
  const handleTimeout = () => {
    cleanup(null)
  }
  const cleanup = (result) => {
    rpc.off(DevtoolsEventType.PageFrameRequestedNavigation, handleFrameNavigation)
    rpc.off(DevtoolsEventType.PageFrameStoppedLoading, handleFrameStoppedLoading)
    rpc.off(DevtoolsEventType.PageDocumentOpened, handleDocumentOpened)
    clearTimeout(timeoutRef)
    resolve(result)
  }
  rpc.on(DevtoolsEventType.PageFrameRequestedNavigation, handleFrameNavigation)
  rpc.on(DevtoolsEventType.PageFrameStoppedLoading, handleFrameStoppedLoading)
  rpc.on(DevtoolsEventType.PageDocumentOpened, handleDocumentOpened)
  const timeoutRef = setTimeout(handleTimeout, timeout)
  return promise
}

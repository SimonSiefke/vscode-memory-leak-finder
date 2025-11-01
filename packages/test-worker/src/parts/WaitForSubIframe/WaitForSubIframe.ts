import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolPage } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

// TODO add timeout variable
const waitForSubFrameContext = (rpc, urlRegex) => {
  const { resolve, promise } = Promise.withResolvers()
  const contexts = Object.create(null)
  let matchingFrameId = ''
  const cleanupMaybe = () => {
    if (matchingFrameId && matchingFrameId in contexts) {
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
  const cleanup = (result) => {
    rpc.off(DevtoolsEventType.RuntimeExecutionContextCreated, handleExecutionContextCreated)
    rpc.off(DevtoolsEventType.PageFrameRequestedNavigation, handleFrameNavigation)
    resolve(result)
  }
  rpc.on(DevtoolsEventType.RuntimeExecutionContextCreated, handleExecutionContextCreated)
  rpc.on(DevtoolsEventType.PageFrameRequestedNavigation, handleFrameNavigation)
  return promise
}

export const waitForSubIframe = async ({ electronRpc, url, electronObjectId, idleTimeout, browserRpc, sessionRpc, createPage }) => {
  // TODO
  // 1. add listener to page frame attached, frameStartedNavigating, check if it matches the expected url, take note of the frame id
  // 2. add listener for runtime execution context created, check if it matches the frame id from above
  // 3. enable page api
  // 4. resolve promise with execution context id and frame Id, clean up listeners

  const subFramePromise = waitForSubFrameContext(sessionRpc, url)
  await DevtoolsProtocolPage.enable()
  const subFrame = await subFramePromise

  // TODO create page with subframe data
}

import { DevtoolsProtocolPage, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as UtilityScript from '../UtilityScript/UtilityScript.ts'
import { waitForSubFrameContext } from '../WaitForSubFrameContext/WaitForSubFrameContext.ts'
import { waitForUtilityExecutionContext } from '../WaitForUtilityExecutionContext/WaitForUtilityExecutionContext.ts'

const getMatchingSubFrame = (frames, url) => {
  for (const frame of frames) {
    if (url.test(frame.url)) {
      return frame
    }
  }
  return undefined
}

export const waitForSubIframe = async ({ electronRpc, url, electronObjectId, idleTimeout, browserRpc, sessionRpc, createPage }) => {
  // TODO
  // 1. add listener to page frame attached, frameStartedNavigating, check if it matches the expected url, take note of the frame id
  // 2. add listener for runtime execution context created, check if it matches the frame id from above
  // 3. enable page api
  // 4. resolve promise with execution context id and frame Id, clean up listeners

  const subFramePromise = waitForSubFrameContext(sessionRpc, url, 3_000)
  await DevtoolsProtocolPage.enable(sessionRpc)
  const subFrame = await subFramePromise
  await DevtoolsProtocolPage.disable(sessionRpc)
  console.log({ subFrame })

  const { frameTree } = await DevtoolsProtocolPage.getFrameTree(sessionRpc)
  const childFrames = frameTree.childFrames.map((item) => item.frame)
  const matchingFrame = getMatchingSubFrame(childFrames, url)
  await new Promise((r) => {})
  console.log({ childFrames })
  if (!matchingFrame) {
    throw new Error(`no matching frame found`)
  }

  const executionContextPromise = waitForUtilityExecutionContext(sessionRpc)
  const { executionContextId } = await DevtoolsProtocolPage.createIsolatedWorld(sessionRpc, {
    frameId: matchingFrame.id,
    worldName: 'utility',
  })

  const utilityContext = await executionContextPromise
  const utilityScript = await UtilityScript.getUtilityScript()
  await DevtoolsProtocolRuntime.evaluate(sessionRpc, {
    contextId: executionContextId,
    expression: utilityScript,
  })

  const iframe = createPage({
    electronObjectId,
    electronRpc,
    idleTimeout,
    rpc: sessionRpc,
    sessionId: sessionRpc.sessionId,
    targetId: '', // TODO use that of parent target
    utilityContext,
    browserRpc,
    sessionRpc,
  })
  return iframe
}

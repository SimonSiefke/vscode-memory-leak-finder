import { DevtoolsProtocolPage, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { waitForSubFrameContext } from '../WaitForSubFrameContext/WaitForSubFrameContext.ts'
import * as UtilityScript from '../UtilityScript/UtilityScript.ts'
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

  const timeout = 10_000
  const subFramePromise = waitForSubFrameContext(sessionRpc, url, timeout)
  const { frameTree } = await DevtoolsProtocolPage.getFrameTree(sessionRpc)
  console.log({ frameTree })
  const childFrames = frameTree.childFrames.map((item) => item.frame)
  const matchingFrame = getMatchingSubFrame(childFrames, url)
  if (!matchingFrame) {
    throw new Error(`no matching frame found`)
  }

  // TODO wait for execution context created to get unique id
  const executionContextPromise = waitForUtilityExecutionContext(sessionRpc)
  console.log({ matchingFrame })
  const { executionContextId } = await DevtoolsProtocolPage.createIsolatedWorld(sessionRpc, {
    frameId: matchingFrame.id,
    worldName: 'utility',
  })

  const context = await executionContextPromise
  console.log({ context })
  const utilityScript = await UtilityScript.getUtilityScript()
  await DevtoolsProtocolRuntime.evaluate(sessionRpc, {
    contextId: executionContextId,
    expression: utilityScript,
  })

  console.log({ executionContextId })
  await new Promise((r) => {})
  // TODO create page with subframe data
}

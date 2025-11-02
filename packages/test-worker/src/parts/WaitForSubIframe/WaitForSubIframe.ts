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
  console.log('enabled page')
  const { frameTree } = await DevtoolsProtocolPage.getFrameTree(sessionRpc)
  const childFrames = frameTree.childFrames.map((item) => item.frame)
  console.log({ childFrames })

  const subFrame = await subFramePromise
  // await DevtoolsProtocolPage.disable(sessionRpc)
  console.log({ subFrame })

  const matchingFrame = getMatchingSubFrame(childFrames, url)
  if (!matchingFrame) {
    throw new Error(`no matching frame found`)
  }

  const utilityExecutionContextName = 'utility-iframe'
  const executionContextPromise = waitForUtilityExecutionContext(sessionRpc, utilityExecutionContextName)

  await DevtoolsProtocolPage.createIsolatedWorld(sessionRpc, {
    frameId: matchingFrame.id,
    worldName: utilityExecutionContextName,
  })

  const utilityContext = await executionContextPromise
  const utilityScript = await UtilityScript.getUtilityScript()
  await DevtoolsProtocolRuntime.evaluate(sessionRpc, {
    uniqueContextId: utilityContext.uniqueId,
    expression: utilityScript,
  })

  const html = await DevtoolsProtocolRuntime.evaluate(sessionRpc, {
    uniqueContextId: utilityContext.uniqueId,
    expression: `document.body.innerHTML`,
  })
  console.log({ html })
  await new Promise((r) => {})

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

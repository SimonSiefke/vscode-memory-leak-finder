import { addUtilityExecutionContext } from '../AddUtilityExecutionContext/AddUtilityExecutionContext.ts'
import { waitForSubFrame } from '../WaitForSubFrameContext/WaitForSubFrameContext.ts'

export const waitForSubIframe = async ({
  browserRpc,
  createPage,
  electronObjectId,
  electronRpc,
  idleTimeout,
  injectUtilityScript,
  sessionRpc,
  url,
}) => {
  // TODO
  // 1. add listener to page frame attached, frameStartedNavigating, check if it matches the expected url, take note of the frame id
  // 2. add listener for runtime execution context created, check if it matches the frame id from above
  // 3. enable page api
  // 4. resolve promise with execution context id and frame Id, clean up listeners

  const subFrame = await waitForSubFrame(sessionRpc, url, 3000)
  if (!subFrame) {
    throw new Error(`no matching frame found`)
  }

  let utilityContext = undefined
  if (injectUtilityScript) {
    const utilityExecutionContextName = 'utility-iframe'
    utilityContext = await addUtilityExecutionContext(sessionRpc, utilityExecutionContextName, subFrame.id)
  }

  const iframe = createPage({
    browserRpc,
    electronObjectId,
    electronRpc,
    idleTimeout,
    rpc: sessionRpc,
    sessionId: sessionRpc.sessionId,
    sessionRpc,
    targetId: '', // TODO use that of parent target
    utilityContext,
  })
  return iframe
}

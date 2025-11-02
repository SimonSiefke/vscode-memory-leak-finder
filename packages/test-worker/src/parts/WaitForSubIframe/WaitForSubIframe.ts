import { addUtilityExecutionContext } from '../AddUtilityExecutionContext/AddUtilityExecutionContext.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { waitForSubFrame } from '../WaitForSubFrameContext/WaitForSubFrameContext.ts'

export const waitForSubIframe = async ({ electronRpc, url, electronObjectId, idleTimeout, browserRpc, sessionRpc, createPage }) => {
  // TODO
  // 1. add listener to page frame attached, frameStartedNavigating, check if it matches the expected url, take note of the frame id
  // 2. add listener for runtime execution context created, check if it matches the frame id from above
  // 3. enable page api
  // 4. resolve promise with execution context id and frame Id, clean up listeners

  const subFrame = await waitForSubFrame(sessionRpc, url, 3_000)
  if (!subFrame) {
    throw new Error(`no matching frame found`)
  }

  const utilityExecutionContextName = 'utility-iframe'
  const utilityContext = await addUtilityExecutionContext(sessionRpc, utilityExecutionContextName, subFrame.id)

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

import { DevtoolsProtocolPage } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { waitForSubFrameContext } from '../WaitForSubFrameContext/WaitForSubFrameContext.ts'

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
  const childFrames = frameTree.childFrames
  console.log({ frameTree })
  console.log({ childFrames })

  await new Promise((r) => {})
  // TODO create page with subframe data
}

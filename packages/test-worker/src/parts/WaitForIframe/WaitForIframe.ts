import { addUtilityExecutionContext } from '../AddUtilityExecutionContext/AddUtilityExecutionContext.ts'
import { createSessionRpcConnection } from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

const findMatchingIframe = (targets, expectedUrl) => {
  for (const target of targets) {
    if (expectedUrl.test(target.title)) {
      return target
    }
  }
  return undefined
}

export const waitForIframe = async ({
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
  // 1. enable page api
  // 2. add listener to page frame attached, frameStartedNavigating, check if it matches the expected url, take note of the frame id
  // 3. add listener for runtime execution context created, check if it matches the frame id from above
  // 4. resolve promise with execution context id and frame Id, clean up listeners

  // TODO ask browser rpc for targets / add target change listener
  const targets = await DevtoolsProtocolTarget.getTargets(sessionRpc)
  const iframes = targets.filter((target) => target.type === 'iframe')
  const matchingIframe = findMatchingIframe(iframes, url)
  if (!matchingIframe) {
    throw new Error(`no matching iframe found for ${url}`)
  }

  const iframeSessionId = await DevtoolsProtocolTarget.attachToTarget(sessionRpc, {
    flatten: true,
    targetId: matchingIframe.targetId,
  })
  const iframeRpc = createSessionRpcConnection(browserRpc, iframeSessionId)

  let iframeUtilityContext = undefined

  const utilityExecutionContextName = 'utility'

  if (injectUtilityScript) {
    const frameId = '' // TODO
    iframeUtilityContext = await addUtilityExecutionContext(iframeRpc, utilityExecutionContextName, frameId)
  }

  const iframe = createPage({
    browserRpc,
    electronObjectId,
    electronRpc,
    idleTimeout,
    rpc: iframeRpc,
    sessionId: iframeRpc.sessionId,
    sessionRpc: iframeRpc,
    targetId: matchingIframe.targetId,
    utilityContext: iframeUtilityContext,
  })
  return iframe
}

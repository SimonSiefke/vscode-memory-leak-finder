import { createSessionRpcConnection } from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolPage, DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as UtilityScript from '../UtilityScript/UtilityScript.ts'
import * as WaitForUtilityExecutionContext from '../WaitForUtilityExecutionContext/WaitForUtilityExecutionContext.ts'

const findMatchingIframe = (targets, expectedUrl) => {
  for (const target of targets) {
    if (expectedUrl.test(target.title)) {
      return target
    }
  }
  return undefined
}

export const waitForIframe = async ({
  electronRpc,
  url,
  electronObjectId,
  idleTimeout,
  browserRpc,
  sessionRpc,
  createPage,
  injectUtilityScript,
}) => {
  console.log('before wait for iframe')
  // TODO
  // 1. enable page api
  // 2. add listener to page frame attached, frameStartedNavigating, check if it matches the expected url, take note of the frame id
  // 3. add listener for runtime execution context created, check if it matches the frame id from above
  // 4. resolve promise with execution context id and frame Id, clean up listeners

  // TODO ask browser rpc for targets / add target change listener
  const targets = await DevtoolsProtocolTarget.getTargets(sessionRpc)
  console.log('after targerts')
  const iframes = targets.filter((target) => target.type === 'iframe')
  const matchingIframe = findMatchingIframe(iframes, url)
  if (!matchingIframe) {
    throw new Error(`no matching iframe found for ${url}`)
  }

  const iframeSessionId = await DevtoolsProtocolTarget.attachToTarget(sessionRpc, {
    targetId: matchingIframe.targetId,
    flatten: true,
  })
  const iframeRpc = createSessionRpcConnection(browserRpc, iframeSessionId)

  let iframeUtilityContext = undefined

  console.trace({ injectUtilityScript })
  const utilityExecutionContextName = 'utility'

  if (injectUtilityScript) {
    const script = await UtilityScript.getUtilityScript()

    const executionContextPromise = WaitForUtilityExecutionContext.waitForUtilityExecutionContext(iframeRpc, utilityExecutionContextName)

    await Promise.all([
      DevtoolsProtocolPage.enable(iframeRpc),
      DevtoolsProtocolPage.addScriptToEvaluateOnNewDocument(iframeRpc, {
        source: script,
        worldName: utilityExecutionContextName,
        runImmediately: true,
      }),
    ])
    iframeUtilityContext = await executionContextPromise
  }

  const iframe = createPage({
    electronObjectId,
    electronRpc,
    idleTimeout,
    rpc: iframeRpc,
    sessionId: iframeRpc.sessionId,
    targetId: matchingIframe.targetId,
    utilityContext: iframeUtilityContext,
    browserRpc,
    sessionRpc: iframeRpc,
  })
  return iframe
}

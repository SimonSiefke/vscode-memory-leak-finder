import { createSessionRpcConnection } from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolPage, DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as Page from '../Page/Page.ts'
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

export const waitForIframe = async ({ electronRpc, url, electronObjectId, idleTimeout, browserRpc, sessionRpc }) => {
  // TODO ask browser rpc for targets / add target change listener
  const targets = await DevtoolsProtocolTarget.getTargets(sessionRpc)
  const iframes = targets.filter((target) => target.type === 'iframe')
  const matchingIframe = findMatchingIframe(iframes, url)
  if (!matchingIframe) {
    throw new Error(`no matching iframe found`)
  }

  const iframeSessionId = await DevtoolsProtocolTarget.attachToTarget(sessionRpc, {
    targetId: matchingIframe.targetId,
    flatten: true,
  })
  const iframeRpc = createSessionRpcConnection(browserRpc, iframeSessionId)

  const script = await UtilityScript.getUtilityScript()

  const executionContextPromise = WaitForUtilityExecutionContext.waitForUtilityExecutionContext(iframeRpc)
  await Promise.all([
    DevtoolsProtocolPage.enable(sessionRpc),
    DevtoolsProtocolPage.addScriptToEvaluateOnNewDocument(iframeRpc, {
      source: script,
      worldName: 'utility',
      runImmediately: true,
    }),
  ])
  const iframeUtilityContext = await executionContextPromise

  const iframe = Page.create({
    electronObjectId,
    electronRpc,
    idleTimeout,
    rpc: iframeRpc,
    sessionId: iframeRpc.sessionId,
    targetId: matchingIframe.targetId,
    utilityContext: iframeUtilityContext,
  })
  return iframe
}

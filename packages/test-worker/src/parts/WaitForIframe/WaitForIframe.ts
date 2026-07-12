import { addUtilityExecutionContext } from '../AddUtilityExecutionContext/AddUtilityExecutionContext.ts'
import { createSessionRpcConnection } from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolTarget, DevtoolsProtocolPage } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

interface TargetInfo {
  readonly targetId: string
  readonly title: string
  readonly type: string
  readonly url: string
}

const findMatchingIframe = (targets, expectedUrl) => {
  for (const target of targets) {
    if (expectedUrl.test(target.url) || expectedUrl.test(target.title)) {
      return target
    }
  }
  return undefined
}

const waitForMatchingIframe = async (sessionRpc, url, timeout = 30_000) => {
  const deadline = performance.now() + timeout
  let targets: readonly TargetInfo[] = []
  while (performance.now() < deadline) {
    targets = (await DevtoolsProtocolTarget.getTargets(sessionRpc)) as readonly TargetInfo[]
    const matchingIframe = findMatchingIframe(
      targets.filter((target) => target.type === 'iframe'),
      url,
    )
    if (matchingIframe) {
      return matchingIframe
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  const iframeTargets = targets.filter((target) => target.type === 'iframe').map((target) => `${target.title} (${target.url})`)
  throw new Error(`no matching iframe found for ${url} within ${timeout}ms. Iframe targets: ${iframeTargets.join(', ') || 'none'}`)
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
  const matchingIframe = await waitForMatchingIframe(sessionRpc, url)

  const iframeSessionId = await DevtoolsProtocolTarget.attachToTarget(sessionRpc, {
    flatten: true,
    targetId: matchingIframe.targetId,
  })
  const iframeRpc = createSessionRpcConnection(browserRpc, iframeSessionId)

  let iframeUtilityContext = undefined

  const utilityExecutionContextName = 'utility'

  if (injectUtilityScript) {
    const { frameTree } = await DevtoolsProtocolPage.getFrameTree(iframeRpc)
    const frameId = frameTree.frame.id
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

export const waitForPage = async ({
  browserRpc,
  createPage,
  electronObjectId,
  electronRpc,
  idleTimeout,
  injectUtilityScript,
  sessionId,
}) => {
  // Wait for a newly created page/window
  // Similar to waitForIframe but for a new page instead of an iframe

  const pageRpc = createSessionRpcConnection(browserRpc, sessionId)

  let pageUtilityContext = undefined

  const utilityExecutionContextName = 'utility'

  if (injectUtilityScript) {
    // Get the main frame ID from the frame tree
    const frameTreeResult = await DevtoolsProtocolPage.getFrameTree(pageRpc)
    const mainFrameId = frameTreeResult.frameTree.frame.id
    pageUtilityContext = await addUtilityExecutionContext(pageRpc, utilityExecutionContextName, mainFrameId)
  }
  await pageRpc.invoke('Runtime.runIfWaitingForDebugger', {})

  const page = createPage({
    browserRpc,
    electronObjectId,
    electronRpc,
    idleTimeout,
    rpc: pageRpc,
    sessionId: pageRpc.sessionId,
    sessionRpc: pageRpc,
    targetId: '', // TODO: get the actual targetId if needed
    utilityContext: pageUtilityContext,
  })
  return page
}

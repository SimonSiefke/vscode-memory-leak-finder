import { createSessionRpcConnection } from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolPage, DevtoolsProtocolRuntime, DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as UtilityScript from '../UtilityScript/UtilityScript.ts'
import { waitForAttachedEvent } from '../WaitForAttachedEvent/WaitForAttachedEvent.ts'
import * as WaitForUtilityExecutionContext from '../WaitForUtilityExecutionContext/WaitForUtilityExecutionContext.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'

const findMatchingIframe = (targets, expectedUrl) => {
  for (const target of targets) {
    if (expectedUrl.test(target.title)) {
      return target
    }
  }
  return undefined
}

export const waitForIframe = async ({ electronRpc, url, electronObjectId, idleTimeout, browserRpc, sessionRpc, createPage }) => {
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
    const eventPromise = waitForAttachedEvent(sessionRpc, 10_000)

    await DevtoolsProtocolTarget.setAutoAttach(sessionRpc, {
      autoAttach: true,
      waitForDebuggerOnStart: false,
      flatten: true,
      filter: [
        {
          type: 'browser',
          exclude: true,
        },
        {
          type: 'tab',
          exclude: true,
        },
        {
          type: 'page',
          exclude: false,
        },
        {
          type: 'iframe',
          exclude: false,
        },
      ],
    })

    const event = await eventPromise

    if (event === null) {
      const targets1 = await DevtoolsProtocolTarget.getTargets(sessionRpc)
      const targets2 = await DevtoolsProtocolTarget.getTargets(browserRpc)

      console.log({ targets1, targets2 })
      await new Promise((r) => {})

      throw new Error(`no matching iframe found for ${url}`)
    }
    const targetInfo = event.params.targetInfo

    const targets1 = await DevtoolsProtocolTarget.getTargets(sessionRpc)
    const targets2 = await DevtoolsProtocolTarget.getTargets(browserRpc)

    console.log({ targets1, targets2 })
    const frames = await DevtoolsProtocolPage.getFrameTree(sessionRpc)
    console.log({ frames })

    await new Promise((r) => {})
    throw new Error(`no matching iframe found for ${url}`)
  }

  // TODO need to wait for that frame

  const iframeSessionId = await DevtoolsProtocolTarget.attachToTarget(sessionRpc, {
    targetId: matchingIframe.targetId,
    flatten: true,
  })
  const iframeRpc = createSessionRpcConnection(browserRpc, iframeSessionId)

  const script = await UtilityScript.getUtilityScript()

  const executionContextPromise = WaitForUtilityExecutionContext.waitForUtilityExecutionContext(iframeRpc)

  await Promise.all([
    DevtoolsProtocolPage.enable(iframeRpc),
    DevtoolsProtocolPage.addScriptToEvaluateOnNewDocument(iframeRpc, {
      source: script,
      worldName: 'utility',
      runImmediately: true,
    }),
  ])
  const iframeUtilityContext = await executionContextPromise

  // const frames = await DevtoolsProtocolPage.getFrameTree(iframeRpc)

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

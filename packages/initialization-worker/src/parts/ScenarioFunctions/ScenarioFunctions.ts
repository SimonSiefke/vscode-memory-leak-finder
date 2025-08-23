import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolPage, DevtoolsProtocolRuntime, DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as DevtoolsTargetType from '../DevtoolsTargetType/DevtoolsTargetType.ts'
import * as PTimeout from '../PTimeout/PTimeout.ts'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.ts'
import * as UtilityScript from '../UtilityScript/UtilityScript.ts'

const handleAttachedToBrowser = (message) => {
  console.log('attached to browser', message)
}

export const handleTargetCrashed = (message) => {
  console.log('target crashed', message)
}

const handleAttachedToPage = async (message) => {
  try {
    const { sessionId } = message.params
    const browserSession = SessionState.getSession('browser')
    const browserRpc = browserSession.rpc
    const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)

    await PTimeout.pTimeout(
      Promise.all([
        DevtoolsProtocolPage.enable(sessionRpc),
        DevtoolsProtocolPage.setLifecycleEventsEnabled(sessionRpc, { enabled: true }),
        DevtoolsProtocolPage.addScriptToEvaluateOnNewDocument(sessionRpc, {
          source: UtilityScript.getUtilityScript(),
          worldName: 'utility',
        }),
        DevtoolsProtocolTarget.setAutoAttach(sessionRpc, {
          autoAttach: true,
          waitForDebuggerOnStart: true,
          flatten: true,
        }),
        DevtoolsProtocolRuntime.enable(sessionRpc),
        DevtoolsProtocolRuntime.runIfWaitingForDebugger(sessionRpc),
      ]),
      { milliseconds: TimeoutConstants.AttachToPage },
    )
  } catch (error) {
    // @ts-ignore
    if (error && error.name === 'TestFinishedError') {
      return
    }
    console.error(
      `[test-worker] Failed to attach to page ${message.params.targetInfo.targetId} ${message.params.targetInfo.browserContextId}: ${error}`,
    )
  }
}

const handleAttachedToIframe = async (message) => {
  await handleAttachedToPage(message)
}

export const handleAttachedToTarget = (message) => {
  const { type } = message.params.targetInfo
  switch (type) {
    case DevtoolsTargetType.Page:
      return handleAttachedToPage(message)
    case DevtoolsTargetType.Iframe:
      return handleAttachedToIframe(message)
    case DevtoolsTargetType.Browser:
      return handleAttachedToBrowser(message)
    default:
      console.warn(`unsupported attachment type ${type}`)
  }
}

export const handleDetachedFromTarget = (message) => {
  SessionState.removeSession(message.params.sessionId)
}

export const handleTargetCreated = async () => {}

export const handlePageLoadEventFired = () => {
  // console.log('load event fired', message)
}

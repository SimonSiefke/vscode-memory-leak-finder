import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolPage, DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
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
  console.log('attached to page. need to add utility script')
  // try {
  //   const { sessionId } = message.params
  //   const browserSession = SessionState.getSession('browser')
  //   const browserRpc = browserSession.rpc
  //   const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)

  //   await PTimeout.pTimeout(
  //     Promise.all([
  //       DevtoolsProtocolPage.addScriptToEvaluateOnNewDocument(sessionRpc, {
  //         source: UtilityScript.getUtilityScript(),
  //         worldName: 'utility',
  //       }),
  //       DevtoolsProtocolTarget.setAutoAttach(sessionRpc, {
  //         autoAttach: true,
  //         waitForDebuggerOnStart: true,
  //         flatten: true,
  //       }),
  //     ]),
  //     { milliseconds: TimeoutConstants.AttachToPage },
  //   )
  // } catch (error) {
  //   console.error(
  //     `[initialization-worker] Failed to attach to page ${message.params.targetInfo.targetId} ${message.params.targetInfo.browserContextId}: ${error}`,
  //   )
  // }
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

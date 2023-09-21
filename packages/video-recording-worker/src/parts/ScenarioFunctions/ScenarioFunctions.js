import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.js'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.js'
import { DevtoolsProtocolPage } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as DevtoolsTargetType from '../DevtoolsTargetType/DevtoolsTargetType.js'
import * as HandleFrame from '../HandleFrame/HandleFrame.js'
import * as PTimeout from '../PTimeout/PTimeout.js'
import * as SessionState from '../SessionState/SessionState.js'
import * as TargetState from '../TargetState/TargetState.js'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.js'

const handleAttachedToBrowser = (message) => {
  console.log('attached to browser', message)
}

const handleAttachedToPage = async (message) => {
  try {
    const sessionId = message.params.sessionId
    const browserSession = SessionState.getSession('browser')
    const browserRpc = browserSession.rpc
    const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)
    const targetId = message.params.targetInfo.targetId
    const type = message.params.targetInfo.type
    const url = message.params.targetInfo.url
    const browserContextId = message.params.targetInfo.browserContextId
    SessionState.addSession(sessionId, {
      type,
      url,
      sessionId,
      rpc: sessionRpc,
    })
    TargetState.addTarget(targetId, {
      type: DevtoolsTargetType.Page,
      url,
      browserContextId,
      sessionId,
      targetId,
    })
    sessionRpc.on(DevtoolsEventType.PageScreencastFrame, HandleFrame.handleFrame)
    await PTimeout.pTimeout(
      Promise.all([
        DevtoolsProtocolPage.enable(sessionRpc),
        DevtoolsProtocolPage.startScreencast(sessionRpc, {
          format: 'jpeg',
          quality: 90,
          maxWidth: 1024,
          maxHeight: 768,
        }),
      ]),
      {
        milliseconds: TimeoutConstants.AttachToPage,
      },
    )
  } catch (error) {
    if (error && error.name === 'TestFinishedError') {
      return
    }
    console.error(
      `[video-recording-worker] Failed to attach to page ${message.params.targetInfo.targetId} ${message.params.targetInfo.browserContextId}: ${error}`,
    )
  }
}

export const handleAttachedToTarget = (message) => {
  const type = message.params.targetInfo.type
  switch (type) {
    case DevtoolsTargetType.Page:
      return handleAttachedToPage(message)
    case DevtoolsTargetType.Browser:
      return handleAttachedToBrowser(message)
    default:
      break
  }
}
export const handleDetachedFromTarget = (message) => {
  SessionState.removeSession(message.params.sessionId)
}

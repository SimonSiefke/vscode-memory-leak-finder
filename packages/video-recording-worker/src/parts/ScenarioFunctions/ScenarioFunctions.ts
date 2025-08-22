import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolPage } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as DevtoolsTargetType from '../DevtoolsTargetType/DevtoolsTargetType.ts'
import * as HandleFrame from '../HandleFrame/HandleFrame.ts'
import * as PTimeout from '../PTimeout/PTimeout.ts'
import * as ScreencastQuality from '../ScreencastQuality/ScreencastQuality.ts'
import * as SessionState from '../SessionState/SessionState.ts'
import * as TargetState from '../TargetState/TargetState.ts'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.ts'

const handleAttachedToBrowser = (message: any) => {
  console.log('attached to browser', message)
}

const handleAttachedToPage = async (message: any) => {
  try {
    const { sessionId } = message.params
    const browserSession = SessionState.getSession('browser')
    const browserRpc = browserSession.rpc
    const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)
    const { targetId } = message.params.targetInfo
    const { type } = message.params.targetInfo
    const { url } = message.params.targetInfo
    const { browserContextId } = message.params.targetInfo
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
          quality: ScreencastQuality.screencastQuality,
          maxWidth: 1024,
          maxHeight: 768,
        }),
      ]),
      {
        milliseconds: TimeoutConstants.AttachToPage,
      },
    )
  } catch (error) {
    // @ts-ignore
    if (error && error.name === 'TestFinishedError') {
      return
    }
    console.error(
      `[video-recording-worker] Failed to attach to page ${message.params.targetInfo.targetId} ${message.params.targetInfo.browserContextId}: ${error}`,
    )
  }
}

export const handleAttachedToTarget = (message: any) => {
  const { type } = message.params.targetInfo
  switch (type) {
    case DevtoolsTargetType.Page:
      return handleAttachedToPage(message)
    case DevtoolsTargetType.Browser:
      return handleAttachedToBrowser(message)
    default:
      break
  }
}
export const handleDetachedFromTarget = (message: any) => {
  SessionState.removeSession(message.params.sessionId)
}

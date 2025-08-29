import * as Assert from '../Assert/Assert.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolPage, DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as HandleFrame from '../HandleFrame/HandleFrame.ts'
import * as ObjectType from '../ObjectType/ObjectType.ts'
import * as PTimeout from '../PTimeout/PTimeout.ts'
import * as ScreencastQuality from '../ScreencastQuality/ScreencastQuality.ts'
import * as SessionState from '../SessionState/SessionState.ts'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.ts'
import { waitForAttachedEvent } from '../WaitForAttachedEvent/WaitForAttachedEvent.ts'

export const connectDevtools = async (devtoolsWebSocketUrl: string, attachedToPageTimeout: number): Promise<void> => {
  Assert.string(devtoolsWebSocketUrl)
  const browserIpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  const browserRpc = DebuggerCreateRpcConnection.createRpc(browserIpc)

  SessionState.addSession('browser', {
    type: ObjectType.Browser,
    objectType: ObjectType.Browser,
    url: '',
    sessionId: '',
    rpc: browserRpc,
  })

  const eventPromise = waitForAttachedEvent(browserRpc, attachedToPageTimeout)

  await DevtoolsProtocolTarget.setAutoAttach(browserRpc, {
    autoAttach: true,
    waitForDebuggerOnStart: false,
    flatten: true,
  })

  const event = await eventPromise

  if (!event) {
    throw new Error(`Failed to attach to page`)
  }

  const sessionId = event.params.sessionId

  const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)

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
      milliseconds: attachedToPageTimeout,
    },
  )
}

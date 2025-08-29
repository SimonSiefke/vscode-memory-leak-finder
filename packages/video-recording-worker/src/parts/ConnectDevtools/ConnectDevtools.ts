import * as Assert from '../Assert/Assert.ts'
import { connectScreenRecording } from '../ConnectScreenRecording/ConnectScreenRecording.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { waitForAttachedEvent } from '../WaitForAttachedEvent/WaitForAttachedEvent.ts'

export const connectDevtools = async (devtoolsWebSocketUrl: string, attachedToPageTimeout: number): Promise<void> => {
  Assert.string(devtoolsWebSocketUrl)
  const browserIpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  const browserRpc = DebuggerCreateRpcConnection.createRpc(browserIpc)

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

  await connectScreenRecording(sessionRpc, attachedToPageTimeout)
}

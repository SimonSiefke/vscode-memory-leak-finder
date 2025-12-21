import * as Assert from '../Assert/Assert.ts'
import { connectScreenRecording } from '../ConnectScreenRecording/ConnectScreenRecording.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { waitForSession } from '../WaitForSession/WaitForSession.ts'

export const connectDevtools = async (devtoolsWebSocketUrl: string, attachedToPageTimeout: number): Promise<void> => {
  Assert.string(devtoolsWebSocketUrl)
  const browserRpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  const { sessionRpc } = await waitForSession(browserRpc, attachedToPageTimeout)
  await connectScreenRecording(sessionRpc, attachedToPageTimeout)
}

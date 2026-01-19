import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { setSessionRpc } from '../SessionState/SessionState.ts'
import { waitForSession } from '../WaitForSession/WaitForSession.ts'

export const connectDevtools = async (
  devtoolsWebSocketUrl: string,
  webSocketUrl: string,
  connectionId: number,
  measureId: string,
): Promise<void> => {
  if (typeof devtoolsWebSocketUrl !== 'string' || !devtoolsWebSocketUrl.trim()) {
    throw new Error('devtoolsWebSocketUrl must be a non-empty string')
  }
  if (typeof connectionId !== 'number' || connectionId < 0) {
    throw new Error('connectionId must be a non-negative number')
  }
  if (typeof measureId !== 'string' || !measureId.trim()) {
    throw new Error('measureId must be a non-empty string')
  }

  const browserRpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  const { sessionRpc } = await waitForSession(browserRpc, 19990)

  // TODO seems to be not working. maybe electron bug?
  sessionRpc.on('Fetch.requestPaused', (event) => {})
  // Store sessionRpc for GetFunctionStatistics
  setSessionRpc(sessionRpc)
}

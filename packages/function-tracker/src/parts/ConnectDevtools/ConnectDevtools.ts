import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { DevtoolsProtocolPage } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { setSessionRpc } from '../GetFunctionStatistics/GetFunctionStatistics.ts'
import { trackingCode } from '../TrackingCode/TrackingCode.ts'
import { waitForSession } from '../WaitForSession/WaitForSession.ts'

export interface DevToolsConnection {
  readonly dispose: () => Promise<void>
  readonly sessionId: string
  readonly sessionRpc: any
  readonly targetId: string
}

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

  const [browserRpc] = await Promise.all([DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)])
  const { sessionId, sessionRpc, targetId } = await waitForSession(browserRpc, 19990)

  const { frameTree } = await DevtoolsProtocolPage.getFrameTree(sessionRpc)
  const frameId = frameTree.frame.id

  console.log({ frameId })

  sessionRpc.on('Fetch.requestPaused', (event) => {
    console.log('paused', event)
  })

  await sessionRpc.invoke('Fetch.enable', {
    patterns: [{ urlPattern: '*.js', requestStage: 'Request' }],
  })

  console.log('fetch enabled')
  void sessionRpc
    .invoke('Runtime.evaluate', {
      expression: trackingCode,
    })
    .catch((error) => {
      console.error('err', error)
    })

  // Store sessionRpc for GetFunctionStatistics
  setSessionRpc(sessionRpc)
}

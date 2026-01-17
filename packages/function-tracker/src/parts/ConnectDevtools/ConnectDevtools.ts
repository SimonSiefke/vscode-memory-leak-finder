import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { setSessionRpc } from '../GetFunctionStatistics/GetFunctionStatistics.ts'
import { trackingCode } from '../TrackingCode/TrackingCode.ts'

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

  // Create our own separate browser connection
  const browserIpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  const browserRpc = DebuggerCreateRpcConnection.createRpc(browserIpc)

  // Get existing targets and find the page target
  const targets = await DevtoolsProtocolTarget.getTargets(browserRpc)
  const pageTarget = targets.find((target: any) => target.type === 'page')

  if (!pageTarget) {
    throw new Error('No page target found')
  }

  const sessionId = await DevtoolsProtocolTarget.attachToTarget(browserRpc, {
    targetId: pageTarget.targetId,
    flatten: true,
  })

  const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)

  sessionRpc.on('Fetch.requestPaused', (event) => {
    console.log('paused', event)
  })

  await sessionRpc.invoke('Fetch.enable', {
    patterns: [{ urlPattern: '*.js', requestStage: 'Response' }],
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

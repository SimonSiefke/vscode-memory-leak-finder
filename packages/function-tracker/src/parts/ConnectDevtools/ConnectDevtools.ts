import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolRuntime, DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { setSessionRpc } from '../GetFunctionStatistics/GetFunctionStatistics.ts'
import { trackingCode } from '../TrackingCode/TrackingCode.ts'

export interface DevToolsConnection {
  dispose(): Promise<void>
  sessionId: string
  sessionRpc: any
  targetId: string
}

export const connectDevtools = async (
  devtoolsWebSocketUrl: string,
  webSocketUrl: string,
  connectionId: number,
  measureId: string,
  attachedToPageTimeout: number,
  pid: number,
): Promise<DevToolsConnection> => {
  if (typeof devtoolsWebSocketUrl !== 'string' || !devtoolsWebSocketUrl.trim()) {
    throw new Error('devtoolsWebSocketUrl must be a non-empty string')
  }
  if (typeof connectionId !== 'number' || connectionId < 0) {
    throw new Error('connectionId must be a non-negative number')
  }
  if (typeof measureId !== 'string' || !measureId.trim()) {
    throw new Error('measureId must be a non-empty string')
  }

  try {

    console.log('befor connction')
    // Create our own separate browser connection
    const browserIpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
    const browserRpc = DebuggerCreateRpcConnection.createRpc(browserIpc)

    // Get existing targets and find the page target
    const targets = await DevtoolsProtocolTarget.getTargets(browserRpc)
    const pageTarget = targets.find((target: any) => target.type === 'page')

    if (!pageTarget) {
      throw new Error('No page target found')
    }

    // Attach to the existing target
    const sessionId = await DevtoolsProtocolTarget.attachToTarget(browserRpc, {
      targetId: pageTarget.targetId,
      flatten: true,
    })

    // Create session RPC connection
    const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)

    // Inject tracking code into the page
    await sessionRpc.invoke('Runtime.evaluate', {
      expression: trackingCode,
    })

    // Setup logic to intercept JS network requests
    await sessionRpc.invoke('Network.enable')
    await sessionRpc.invoke('Fetch.enable', {
      patterns: [
        { urlPattern: '*.js', requestStage: 'Response' },
        { urlPattern: '*.mjs', requestStage: 'Response' },
        { urlPattern: '*.cjs', requestStage: 'Response' },
      ],
    })

    console.log(`Function tracker connected for connection ${connectionId}, measure ${measureId}`)

    // Store sessionRpc for GetFunctionStatistics
    setSessionRpc(sessionRpc)

    return {
      async dispose() {
        setSessionRpc(undefined)
        await browserRpc.dispose()
      },
      sessionId,
      sessionRpc,
      targetId: pageTarget.targetId,
    }
  } catch (error) {
    throw new Error(`Failed to setup function tracking: ${error instanceof Error ? error.message : String(error)}`)
  }
}

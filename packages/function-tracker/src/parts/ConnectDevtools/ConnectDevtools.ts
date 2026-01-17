import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { setSessionRpc } from '../GetFunctionStatistics/GetFunctionStatistics.ts'
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

  console.log('called')
  const browserRpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  console.log('browser')
  const { sessionRpc, sessionId } = await waitForSession(browserRpc, 19990)
  console.log('sess')

  console.log('session rpc', sessionRpc)

  sessionRpc.on('Fetch.requestPaused', (event) => {
    console.log('paused', event)
  })

  console.log('session id', sessionId)
  await new Promise((r) => {
    setTimeout(r, 3000)
  })
  // await sessionRpc.invoke('Network.enable')
  // await sessionRpc.invoke('Network.setRequestInterception', {
  //   patterns: [{ urlPattern: '*.js', requestStage: 'Request' }],
  // })

  console.log('before call')
  // await DevtoolsProtocolRuntime.enable(sessionRpc)
  // await DevtoolsProtocolRuntime.runIfWaitingForDebugger(sessionRpc)

  console.log('fetch enabled')
  // void sessionRpc
  //   .invoke('Runtime.evaluate', {
  //     expression: trackingCode,
  //   })
  //   .catch((error) => {
  //     console.error('err', error)
  //   })

  // Store sessionRpc for GetFunctionStatistics
  setSessionRpc(sessionRpc)
}

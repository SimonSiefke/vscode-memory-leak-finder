import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { waitForSession } from '../WaitForSession/WaitForSession.ts'

export const connectDevtools = async (devtoolsWebSocketUrl: string, attachedToPageTimeout: number): Promise<any> => {
  console.error(`[macos-ci-debug] connectDevtools start timeout=${attachedToPageTimeout} url=${devtoolsWebSocketUrl}`)
  const browserIpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  console.error(`[macos-ci-debug] connectDevtools websocket connected`)
  const browserRpc = DebuggerCreateRpcConnection.createRpc(browserIpc)
  const { sessionId, sessionRpc, targetId } = await waitForSession(browserRpc, attachedToPageTimeout)
  console.error(`[macos-ci-debug] connectDevtools session ready sessionId=${sessionId} targetId=${targetId}`)
  await DevtoolsProtocolRuntime.runIfWaitingForDebugger(sessionRpc)
  console.error(`[macos-ci-debug] connectDevtools runIfWaitingForDebugger complete`)
  return {
    async dispose() {
      await browserRpc.dispose()
    },
    sessionId,
    sessionRpc,
    targetId,
  }
}

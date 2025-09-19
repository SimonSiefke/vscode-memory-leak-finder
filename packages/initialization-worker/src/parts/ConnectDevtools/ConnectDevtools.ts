import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import { DevtoolsProtocolPage, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as UtilityScript from '../UtilityScript/UtilityScript.ts'
import { waitForSession } from '../WaitForSession/WaitForSession.ts'

export const connectDevtools = async (devtoolsWebSocketUrl: string, attachedToPageTimeout: number): Promise<any> => {
  const browserIpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  const browserRpc = DebuggerCreateRpcConnection.createRpc(browserIpc)
  const sessionRpc = await waitForSession(browserRpc, attachedToPageTimeout)
  const script = await UtilityScript.getUtilityScript()
  await Promise.all([
    DevtoolsProtocolPage.enable(sessionRpc),
    DevtoolsProtocolPage.setLifecycleEventsEnabled(sessionRpc, { enabled: true }),
    DevtoolsProtocolPage.addScriptToEvaluateOnNewDocument(sessionRpc, {
      source: script,
      worldName: 'utility',
    }),
    DevtoolsProtocolRuntime.enable(sessionRpc),
    DevtoolsProtocolRuntime.runIfWaitingForDebugger(sessionRpc),
  ])
  return sessionRpc
}

import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import * as UtilityScript from '../UtilityScript/UtilityScript.ts'
import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolRuntime, DevtoolsProtocolTarget, DevtoolsProtocolPage } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { waitForAttachedEvent } from '../WaitForAttachedEvent/WaitForAttachedEvent.ts'

export const connectDevtools = async (devtoolsWebSocketUrl: string, attachedToPageTimeout: number): Promise<void> => {
  const browserIpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  const browserRpc = DebuggerCreateRpcConnection.createRpc(browserIpc)

  const eventPromise = waitForAttachedEvent(browserRpc, attachedToPageTimeout)

  await Promise.all([
    DevtoolsProtocolTarget.setAutoAttach(browserRpc, {
      autoAttach: true,
      waitForDebuggerOnStart: true,
      flatten: true,
    }),
    DevtoolsProtocolTarget.setDiscoverTargets(browserRpc, {
      discover: true,
    }),
  ])

  const event = await eventPromise

  if (!event) {
    throw new Error(`Failed to attach to page`)
  }

  const sessionId = event.params.sessionId

  const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)

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
}

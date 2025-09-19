import * as Assert from '../Assert/Assert.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import { DevtoolsProtocolPage, DevtoolsProtocolRuntime, DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetCombinedMeasure from '../GetCombinedMeasure/GetCombinedMeasure.ts'
import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import { waitForSession } from '../WaitForSession/WaitForSession.ts'

export const connectDevtools = async (
  devtoolsWebSocketUrl: string,
  connectionId: number,
  measureId: string,
  attachedToPageTimeout: number,
): Promise<void> => {
  // TODO connect to electron and node processes if should measure node
  Assert.string(devtoolsWebSocketUrl)
  const browserRpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  const { sessionRpc } = await waitForSession(browserRpc, attachedToPageTimeout)
  Promise.all([
    DevtoolsProtocolPage.enable(sessionRpc),
    DevtoolsProtocolPage.setLifecycleEventsEnabled(sessionRpc, { enabled: true }),
    DevtoolsProtocolTarget.setAutoAttach(sessionRpc, {
      autoAttach: true,
      waitForDebuggerOnStart: false,
      flatten: true,
    }),
    DevtoolsProtocolRuntime.enable(sessionRpc),
    DevtoolsProtocolRuntime.runIfWaitingForDebugger(sessionRpc),
  ])
  const measure = await GetCombinedMeasure.getCombinedMeasure(sessionRpc, measureId)
  MemoryLeakFinderState.set(connectionId, measure)
}

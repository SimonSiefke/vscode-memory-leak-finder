import * as Assert from '../Assert/Assert.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'
import { DevtoolsProtocolPage, DevtoolsProtocolRuntime, DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetCombinedMeasure from '../GetCombinedMeasure/GetCombinedMeasure.ts'
import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import * as ObjectType from '../ObjectType/ObjectType.ts'
import * as PTimeout from '../PTimeout/PTimeout.ts'
import * as SessionState from '../SessionState/SessionState.ts'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.ts'
import { waitForAttachedEvent } from '../WaitForAttachedEvent/WaitForAttachedEvent.ts'

export const connectDevtools = async (
  devtoolsWebSocketUrl: string,
  connectionId: number,
  measureId: string,
  attachedToPageTimeout: number,
): Promise<void> => {
  Assert.string(devtoolsWebSocketUrl)
  const browserIpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  const browserRpc = DebuggerCreateRpcConnection.createRpc(browserIpc)

  SessionState.addSession('browser', {
    type: ObjectType.Browser,
    objectType: ObjectType.Browser,
    url: '',
    sessionId: '',
    rpc: browserRpc,
  })

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

  const { sessionId } = event.params

  const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserRpc, sessionId)

  await PTimeout.pTimeout(
    Promise.all([
      DevtoolsProtocolPage.enable(sessionRpc),
      DevtoolsProtocolPage.setLifecycleEventsEnabled(sessionRpc, { enabled: true }),
      DevtoolsProtocolTarget.setAutoAttach(sessionRpc, {
        autoAttach: true,
        waitForDebuggerOnStart: true,
        flatten: true,
      }),
      DevtoolsProtocolRuntime.enable(sessionRpc),
      DevtoolsProtocolRuntime.runIfWaitingForDebugger(sessionRpc),
    ]),
    { milliseconds: TimeoutConstants.AttachToPage },
  )

  const measure = await GetCombinedMeasure.getCombinedMeasure(sessionRpc, measureId)
  MemoryLeakFinderState.set(connectionId, measure)
}

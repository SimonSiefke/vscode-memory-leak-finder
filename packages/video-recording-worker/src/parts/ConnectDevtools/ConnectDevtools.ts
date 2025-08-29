import * as Assert from '../Assert/Assert.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as ObjectType from '../ObjectType/ObjectType.ts'
import * as ScenarioFunctions from '../ScenarioFunctions/ScenarioFunctions.ts'
import * as SessionState from '../SessionState/SessionState.ts'
import { waitForAttachedEvent } from '../WaitForAttachedEvent/WaitForAttachedEvent.ts'

export const connectDevtools = async (devtoolsWebSocketUrl: string, attachedToPageTimeout: number): Promise<void> => {
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

  await DevtoolsProtocolTarget.setAutoAttach(browserRpc, {
    autoAttach: true,
    waitForDebuggerOnStart: false,
    flatten: true,
  })
}

import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as ScenarioFunctions from '../ScenarioFunctions/ScenarioFunctions.ts'

export const connectDevtools = async (devtoolsWebSocketUrl: string): Promise<void> => {
  const browserIpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  const browserRpc = DebuggerCreateRpcConnection.createRpc(browserIpc, true)

  browserRpc.on(DevtoolsEventType.TargetAttachedToTarget, ScenarioFunctions.handleAttachedToTarget)
  browserRpc.on(DevtoolsEventType.TargetDetachedFromTarget, ScenarioFunctions.handleDetachedFromTarget)

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
}

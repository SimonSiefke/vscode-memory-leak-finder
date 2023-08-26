import * as Assert from '../Assert/Assert.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const connectDevtools = (ipc, connectionId, devtoolsWebSocketUrl, monkeyPatchedElectron, electronObjectId, callFrameId) => {
  Assert.object(ipc)
  Assert.number(connectionId)
  Assert.string(devtoolsWebSocketUrl)
  return JsonRpc.invoke(
    ipc,
    TestWorkerCommandType.ConnectDevtools,
    connectionId,
    devtoolsWebSocketUrl,
    monkeyPatchedElectron,
    electronObjectId,
    callFrameId,
  )
}
